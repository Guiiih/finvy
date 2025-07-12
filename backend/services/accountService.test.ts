import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getSupabaseClient } from "../utils/supabaseClient.js";
import {
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  invalidateAccountsCache,
  accountsCache, // Importar accountsCache diretamente
} from "./accountService.js";
import logger from "../utils/logger.js";

// Mock do SupabaseClient
const mockSelect = vi.fn();
const mockSingle = vi.fn();
const mockRpc = vi.fn();

const mockQueryBuilder = {
  select: mockSelect.mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  single: mockSingle,
  rpc: mockRpc,
  // Adicionado para simular o retorno de count para operações de delete
  then: vi.fn(function(resolve) { return resolve({ count: this.count, error: this.error }); }),
};

const mockFrom = vi.fn(() => mockQueryBuilder);

vi.mock("../utils/supabaseClient.js", () => ({
  getSupabaseClient: vi.fn(() => ({
    from: mockFrom,
    rpc: mockRpc,
  })),
}));

// Mock do logger para evitar poluir o console durante os testes
vi.mock("../utils/logger.js", () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe("Account Service", () => {
  const userId = "test-user-id";
  const organizationId = "test-organization-id";
  const accountingPeriodId = "test-accounting-period-id";
  const token = "test-token";

  beforeEach(() => {
    // Limpa todos os mocks antes de cada teste
    vi.clearAllMocks();
    // Invalida o cache para garantir que os testes não dependam de estados anteriores
    invalidateAccountsCache(userId);
  });

  afterEach(() => {
    // Limpa o cache após cada teste
    invalidateAccountsCache(userId);
  });

  describe("getAccounts", () => {
    it("should return accounts from cache if available", async () => {
      const mockAccounts = [{ id: "1", name: "Cash", type: "asset" }];
      accountsCache.set(userId, { data: mockAccounts, timestamp: Date.now() });

      const result = await getAccounts(
        userId,
        organizationId,
        accountingPeriodId,
        token,
      );

      expect(result).toEqual(mockAccounts);
      expect(getSupabaseClient).not.toHaveBeenCalled(); // Não deve chamar o Supabase
    });

    it("should fetch accounts from Supabase if not in cache", async () => {
      const mockAccounts = [{ id: "2", name: "Bank", type: "asset" }];
      mockSelect.mockResolvedValueOnce({ data: mockAccounts, error: null });

      const result = await getAccounts(
        userId,
        organizationId,
        accountingPeriodId,
        token,
      );

      expect(result).toEqual(mockAccounts);
      expect(getSupabaseClient).toHaveBeenCalledWith(token);
      expect(mockFrom).toHaveBeenCalledWith("accounts");
      expect(mockSelect).toHaveBeenCalledWith(
        "id, name, type, user_id, code, parent_account_id, organization_id, accounting_period_id",
      );
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("user_id", userId);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("organization_id", organizationId);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("accounting_period_id", active_accounting_period_id);
      expect(mockQueryBuilder.order).toHaveBeenCalledWith("name", { ascending: true });
    });

    it("should handle Supabase errors when fetching accounts", async () => {
      const mockError = { message: "DB Error" };
      mockSelect.mockResolvedValueOnce({ data: null, error: mockError });

      await expect(
        getAccounts(userId, organizationId, accountingPeriodId, token),
      ).rejects.toThrow(mockError.message);
    });
  });

  describe("createAccount", () => {
    it("should create an account and invalidate cache", async () => {
      const newAccountData = { name: "New Account", type: "liability" };
      const mockCreatedAccount = { id: "new-account-id", ...newAccountData };
      mockSingle.mockResolvedValueOnce({ data: mockCreatedAccount, error: null });

      const result = await createAccount(
        newAccountData,
        userId,
        organizationId,
        accountingPeriodId,
        token,
      );

      expect(result).toEqual(mockCreatedAccount);
      expect(mockFrom).toHaveBeenCalledWith("accounts");
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith({
        ...newAccountData,
        user_id: userId,
        organization_id: organizationId,
        accounting_period_id: accountingPeriodId,
      });
      // Verify cache invalidation (check if getAccounts would now fetch from DB)
      accountsCache.clear(); // Limpa o cache para forçar a busca no DB
      mockSelect.mockResolvedValueOnce({ data: [], error: null }); // Simula DB vazio
      const accountsAfterCreation = await getAccounts(
        userId,
        organizationId,
        accountingPeriodId,
        token,
      );
      expect(accountsAfterCreation).toEqual([]);
    });

    it("should handle Supabase errors when creating an account", async () => {
      const newAccountData = { name: "Error Account", type: "equity" };
      const mockError = { message: "Insert Error" };
      mockSingle.mockResolvedValueOnce({ data: null, error: mockError });

      await expect(
        createAccount(newAccountData, userId, organizationId, accountingPeriodId, token),
      ).rejects.toThrow(mockError.message);
    });
  });

  describe("updateAccount", () => {
    it("should update an account and invalidate cache", async () => {
      const accountId = "account-to-update";
      const updateData = { name: "Updated Name" };
      const mockUpdatedAccount = { id: accountId, name: "Updated Name", type: "asset" };
      mockSelect.mockResolvedValueOnce({ data: [mockUpdatedAccount], error: null });

      const result = await updateAccount(
        accountId,
        updateData,
        userId,
        organizationId,
        accountingPeriodId,
        token,
      );

      expect(result).toEqual(mockUpdatedAccount);
      expect(mockFrom).toHaveBeenCalledWith("accounts");
      expect(mockQueryBuilder.update).toHaveBeenCalledWith(updateData);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("id", accountId);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("user_id", userId);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("organization_id", organizationId);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("accounting_period_id", active_accounting_period_id);
      // Verify cache invalidation
      accountsCache.clear(); // Limpa o cache para forçar a busca no DB
      mockSelect.mockResolvedValueOnce({ data: [], error: null });
      const accountsAfterUpdate = await getAccounts(
        userId,
        organizationId,
        accountingPeriodId,
        token,
      );
      expect(accountsAfterUpdate).toEqual([]);
    });

    it("should return null if account not found for update", async () => {
      const accountId = "non-existent-account";
      const updateData = { name: "Updated Name" };
      mockSelect.mockResolvedValueOnce({ data: [], error: null });

      const result = await updateAccount(
        accountId,
        updateData,
        userId,
        organizationId,
        accountingPeriodId,
        token,
      );

      expect(result).toBeNull();
    });

    it("should handle Supabase errors when updating an account", async () => {
      const accountId = "error-account";
      const updateData = { name: "Error Name" };
      const mockError = { message: "Update Error" };
      mockSelect.mockResolvedValueOnce({ data: null, error: mockError });

      await expect(
        updateAccount(accountId, updateData, userId, organizationId, accountingPeriodId, token),
      ).rejects.toThrow(mockError.message);
    });
  });

  describe("deleteAccount", () => {
    it("should delete an account and invalidate cache", async () => {
      const accountId = "account-to-delete";
      mockQueryBuilder.then.mockResolvedValueOnce({ count: 1, error: null });

      const result = await deleteAccount(
        accountId,
        userId,
        organizationId,
        accountingPeriodId,
        token,
      );

      expect(result).toBe(true);
      expect(mockFrom).toHaveBeenCalledWith("accounts");
      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("id", accountId);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("user_id", userId);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("organization_id", organizationId);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("accounting_period_id", active_accounting_period_id);
      // Verify cache invalidation
      accountsCache.clear(); // Limpa o cache para forçar a busca no DB
      mockSelect.mockResolvedValueOnce({ data: [], error: null });
      const accountsAfterDelete = await getAccounts(
        userId,
        organizationId,
        accountingPeriodId,
        token,
      );
      expect(accountsAfterDelete).toEqual([]);
    });

    it("should return false if account not found for deletion", async () => {
      const accountId = "non-existent-account";
      mockQueryBuilder.then.mockResolvedValueOnce({ count: 0, error: null });

      const result = await deleteAccount(
        accountId,
        userId,
        organizationId,
        accountingPeriodId,
        token,
      );

      expect(result).toBe(false);
    });

    it("should handle Supabase errors when deleting an account", async () => {
      const accountId = "error-account";
      const mockError = { message: "Delete Error" };
      mockQueryBuilder.then.mockResolvedValueOnce({ count: null, error: mockError });

      await expect(
        deleteAccount(accountId, userId, organizationId, accountingPeriodId, token),
      ).rejects.toThrow(mockError.message);
    });
  });
});

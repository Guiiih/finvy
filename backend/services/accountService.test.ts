import { Account } from '../types';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAccounts, createAccount, updateAccount, deleteAccount, invalidateAccountsCache, getCachedAccounts, setCachedAccounts, accountsCache } from './accountService';


// Mocking a Supabase client with chainable methods
const mockQueryBuilder = {
  select: vi.fn(),
  eq: vi.fn(),
  is: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  order: vi.fn(),
  single: vi.fn(),
};

const mockSupabaseClient = {
  from: vi.fn(),
  rpc: vi.fn(),
};

vi.mock('../utils/supabaseClient', () => ({
  getSupabaseClient: vi.fn(() => mockSupabaseClient),
}));

describe('Account Service', () => {
  const mockUserId = 'user-123';
  const mockOrgId = 'org-456';
  const mockPeriodId = 'period-789';
  const mockToken = 'mock-token';

  beforeEach(() => {
    vi.clearAllMocks();
    accountsCache.clear();
    
    // Configure the mock to be chainable by default
    mockQueryBuilder.select.mockReturnThis();
    mockQueryBuilder.eq.mockReturnThis();
    mockQueryBuilder.is.mockReturnThis();
    mockQueryBuilder.insert.mockReturnThis();
    mockQueryBuilder.update.mockReturnThis();
    mockQueryBuilder.delete.mockReturnThis();
    mockQueryBuilder.order.mockReturnThis();
    mockQueryBuilder.single.mockReset(); // Reset single mock

    mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

    invalidateAccountsCache(mockOrgId, mockPeriodId);
  });

  describe('getAccounts', () => {
    it('should fetch accounts from Supabase when cache is empty', async () => {
      const mockAccounts = [{ id: '1', name: 'Cash' }];
      mockQueryBuilder.order.mockResolvedValue({ data: mockAccounts, error: null });

      const result = await getAccounts(mockOrgId, mockPeriodId, mockToken);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('accounts');
      expect(result).toEqual(mockAccounts);
    });

    it('should return cached accounts if available', async () => {
      const cachedAccounts = [{ id: 'cached-1', name: 'Cached Account' }];
      setCachedAccounts(mockOrgId, mockPeriodId, cachedAccounts as Account[]);

      const result = await getAccounts(mockOrgId, mockPeriodId, mockToken);

      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
      expect(result).toEqual(cachedAccounts);
    });
  });

  describe('createAccount', () => {
    it('should create a top-level account and invalidate cache', async () => {
      const newAccountData = { name: 'New Account' };
      const createdAccount = { ...newAccountData, id: '3', code: '1', type: 'asset' };

      // 1. Mock the call to get top-level accounts. Assume none exist.
      // Chain: from -> select -> is -> eq -> eq -> order
      mockQueryBuilder.order.mockResolvedValueOnce({ data: [], error: null });

      // 2. Mock the insert call, which is followed by a select.
      // Chain: from -> insert -> select
      const mockSelectAfterInsert = vi.fn().mockResolvedValue({ data: [createdAccount], error: null });
      mockQueryBuilder.insert.mockReturnValue({ select: mockSelectAfterInsert });

      // Pre-populate cache to verify invalidation
      setCachedAccounts(mockOrgId, mockPeriodId, [{ id: 'pre-cache', name: 'Old data' }] as Account[]);

      const result = await createAccount(newAccountData, mockOrgId, mockPeriodId, mockToken);

      // Verify the insert was called with the correct, generated data
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith(expect.objectContaining({
        name: 'New Account',
        code: '1', // First top-level account
        type: 'asset', // Default type for first top-level
        organization_id: mockOrgId,
        accounting_period_id: mockPeriodId,
      }));

      // Verify the final result
      expect(result).toEqual(createdAccount);

      // Verify cache was invalidated
      expect(getCachedAccounts(mockOrgId, mockPeriodId)).toBeNull();
    });
  });

  describe('updateAccount', () => {
    it('should update an account and invalidate cache', async () => {
      const accountId = '1';
      const updateData = { name: 'Updated Name' };
      const updatedAccount = { id: accountId, ...updateData };
      mockQueryBuilder.update.mockReturnThis();
      mockQueryBuilder.select.mockResolvedValue({ data: [updatedAccount], error: null });

      setCachedAccounts(mockOrgId, mockPeriodId, [{ id: accountId, name: 'Original data' }] as Account[]);

      const result = await updateAccount(accountId, updateData, mockOrgId, mockPeriodId, mockToken);

      expect(mockSupabaseClient.from('accounts').update).toHaveBeenCalledWith(updateData);
      expect(result).toEqual(updatedAccount);
      expect(getCachedAccounts(mockOrgId, mockPeriodId)).toBeNull();
    });
  });

  describe('deleteAccount', () => {
    it('should delete an account if it is not protected', async () => {
      const accountId = '1';
      mockQueryBuilder.select.mockReturnThis();
      mockQueryBuilder.eq.mockReturnThis();
      mockQueryBuilder.single.mockResolvedValue({ data: { is_protected: false }, error: null });
      mockQueryBuilder.delete.mockReturnThis();
      mockQueryBuilder.eq.mockReturnThis();

      const result = await deleteAccount(accountId, mockOrgId, mockPeriodId, mockToken);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('accounts');
      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', accountId);
      expect(result).toBe(true);
    });

    it('should not delete an account if it is protected', async () => {
      const accountId = 'protected-1';
      mockQueryBuilder.select.mockReturnThis();
      mockQueryBuilder.eq.mockReturnThis();
      mockQueryBuilder.single.mockResolvedValue({ data: { is_protected: true }, error: null });

      await expect(deleteAccount(accountId, mockOrgId, mockPeriodId, mockToken)).rejects.toThrow("Esta conta está protegida e não pode ser deletada.");
      expect(mockQueryBuilder.delete).not.toHaveBeenCalled();
    });
  });;
});
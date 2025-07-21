import { VercelRequest, VercelResponse } from "@vercel/node";
import { createRequest, createResponse } from "node-mocks-http";
import handler from "../handlers/financial-transactions";
import {
  getUserOrganizationAndPeriod,
} from "../utils/supabaseClient";
import { vi, describe, it, expect, beforeEach } from "vitest";
import * as financialTransactionService from "../services/financialTransactionService";
import * as schemas from "../utils/schemas";

// Mock the supabaseClient and financialTransactionService modules
vi.mock("../utils/supabaseClient", () => ({
  getUserOrganizationAndPeriod: vi.fn(),
  handleErrorResponse: vi.fn((res, status, message) => {
    res.status(status).json({ error: message });
  }),
}));

vi.mock("../services/financialTransactionService", () => ({
  getFinancialTransactions: vi.fn(),
  createFinancialTransaction: vi.fn(),
}));

vi.mock("../utils/schemas", () => ({
  createFinancialTransactionSchema: {
    safeParse: vi.fn(),
  },
}));

describe("Financial Transactions API Handler", () => {
  const mockUserId = "test-user-id";
  const mockToken = "test-token";
  const mockOrganizationId = "test-org-id";
  const mockAccountingPeriodId = "test-period-id";

  let mockRequest: VercelRequest;
  let mockResponse: VercelResponse;

  beforeEach(() => {
    mockRequest = createRequest();
    mockResponse = createResponse();

    vi.clearAllMocks();

    (getUserOrganizationAndPeriod as vi.Mock).mockResolvedValue({
      organization_id: mockOrganizationId,
      active_accounting_period_id: mockAccountingPeriodId,
    });
  });

  describe("GET /financial-transactions", () => {
    it("should return a list of financial transactions for payable type", async () => {
      const mockTransactions = [
        { id: "1", description: "Rent", amount: 1000, type: "payable" },
      ];
      (financialTransactionService.getFinancialTransactions as vi.Mock).mockResolvedValue(mockTransactions);

      mockRequest.method = "GET";
      mockRequest.query = { type: "payable" };

      await handler(mockRequest, mockResponse, mockUserId, mockToken);

      expect(getUserOrganizationAndPeriod).toHaveBeenCalledWith(mockUserId, mockToken);
      expect(financialTransactionService.getFinancialTransactions).toHaveBeenCalledWith(
        "payable",
        mockUserId,
        mockOrganizationId,
        mockAccountingPeriodId,
        mockToken
      );
      expect(mockResponse._getStatusCode()).toBe(200);
      expect(mockResponse._getJSONData()).toEqual(mockTransactions);
    });

    it("should return a list of financial transactions for receivable type", async () => {
      const mockTransactions = [
        { id: "2", description: "Salary", amount: 2000, type: "receivable" },
      ];
      (financialTransactionService.getFinancialTransactions as vi.Mock).mockResolvedValue(mockTransactions);

      mockRequest.method = "GET";
      mockRequest.query = { type: "receivable" };

      await handler(mockRequest, mockResponse, mockUserId, mockToken);

      expect(financialTransactionService.getFinancialTransactions).toHaveBeenCalledWith(
        "receivable",
        mockUserId,
        mockOrganizationId,
        mockAccountingPeriodId,
        mockToken
      );
      expect(mockResponse._getStatusCode()).toBe(200);
      expect(mockResponse._getJSONData()).toEqual(mockTransactions);
    });

    it("should return 404 if no financial transactions are found", async () => {
      (financialTransactionService.getFinancialTransactions as vi.Mock).mockResolvedValue(null);

      mockRequest.method = "GET";
      mockRequest.query = { type: "payable" };

      await handler(mockRequest, mockResponse, mockUserId, mockToken);

      expect(mockResponse._getStatusCode()).toBe(404);
      expect(mockResponse._getJSONData()).toEqual({
        error: "Transações financeiras não encontradas.",
      });
    });

    it("should return 403 if organization or accounting period not found", async () => {
      (getUserOrganizationAndPeriod as vi.Mock).mockResolvedValue(null);

      mockRequest.method = "GET";
      mockRequest.query = { type: "payable" };

      await handler(mockRequest, mockResponse, mockUserId, mockToken);

      expect(mockResponse._getStatusCode()).toBe(403);
      expect(mockResponse._getJSONData()).toEqual({
        error: "Organização ou período contábil não encontrado para o usuário.",
      });
    });

    it("should handle errors from financialTransactionService", async () => {
      const mockError = new Error("Service error");
      (financialTransactionService.getFinancialTransactions as vi.Mock).mockImplementation(() => {
        throw mockError;
      });

      mockRequest.method = "GET";
      mockRequest.query = { type: "payable" };

      await handler(mockRequest, mockResponse, mockUserId, mockToken);

      expect(mockResponse._getStatusCode()).toBe(500);
      expect(mockResponse._getJSONData()).toEqual({
        error: "Service error",
      });
    });
  });

  describe("POST /financial-transactions", () => {
    it("should create a new financial transaction", async () => {
      const newTransaction = {
        description: "New Expense",
        amount: 150,
        due_date: "2025-08-01",
      };
      const createdTransaction = { id: "trans-1", ...newTransaction };

      (schemas.createFinancialTransactionSchema.safeParse as vi.Mock).mockReturnValue({
        success: true,
        data: newTransaction,
      });
      (financialTransactionService.createFinancialTransaction as vi.Mock).mockResolvedValue(createdTransaction);

      mockRequest.method = "POST";
      mockRequest.query = { type: "payable" };
      mockRequest.body = newTransaction;

      await handler(mockRequest, mockResponse, mockUserId, mockToken);

      expect(getUserOrganizationAndPeriod).toHaveBeenCalledWith(mockUserId, mockToken);
      expect(schemas.createFinancialTransactionSchema.safeParse).toHaveBeenCalledWith(newTransaction);
      expect(financialTransactionService.createFinancialTransaction).toHaveBeenCalledWith(
        "payable",
        newTransaction,
        mockUserId,
        mockOrganizationId,
        mockAccountingPeriodId,
        mockToken
      );
      expect(mockResponse._getStatusCode()).toBe(201);
      expect(mockResponse._getJSONData()).toEqual(createdTransaction);
    });

    it("should return 400 for invalid transaction data", async () => {
      const invalidTransaction = {
        description: "",
        amount: -10,
      };
      const errorMessages = ["Descrição é obrigatória.", "Valor deve ser não negativo."];

      (schemas.createFinancialTransactionSchema.safeParse as vi.Mock).mockReturnValue({
        success: false,
        error: { errors: errorMessages.map(msg => ({ message: msg })) },
      });

      mockRequest.method = "POST";
      mockRequest.query = { type: "payable" };
      mockRequest.body = invalidTransaction;

      await handler(mockRequest, mockResponse, mockUserId, mockToken);

      expect(mockResponse._getStatusCode()).toBe(400);
      expect(mockResponse._getJSONData()).toEqual({
        error: errorMessages.join(", "),
      });
    });

    it("should handle errors from financialTransactionService during creation", async () => {
      const newTransaction = {
        description: "New Expense",
        amount: 150,
        due_date: "2025-08-01",
      };
      const mockError = new Error("Creation service error");

      (schemas.createFinancialTransactionSchema.safeParse as vi.Mock).mockReturnValue({
        success: true,
        data: newTransaction,
      });
      (financialTransactionService.createFinancialTransaction as vi.Mock).mockImplementation(() => {
        throw mockError;
      });

      mockRequest.method = "POST";
      mockRequest.query = { type: "payable" };
      mockRequest.body = newTransaction;

      await handler(mockRequest, mockResponse, mockUserId, mockToken);

      expect(mockResponse._getStatusCode()).toBe(500);
      expect(mockResponse._getJSONData()).toEqual({
        error: "Creation service error",
      });
    });

    it("should return 403 if organization or accounting period not found", async () => {
      (getUserOrganizationAndPeriod as vi.Mock).mockResolvedValue(null);

      mockRequest.method = "POST";
      mockRequest.query = { type: "payable" };
      mockRequest.body = {
        description: "New Expense",
        amount: 150,
        due_date: "2025-08-01",
      };

      await handler(mockRequest, mockResponse, mockUserId, mockToken);

      expect(mockResponse._getStatusCode()).toBe(403);
      expect(mockResponse._getJSONData()).toEqual({
        error: "Organização ou período contábil não encontrado para o usuário.",
      });
    });
  });

  it("should return 405 for unsupported HTTP method", async () => {
    mockRequest.method = "PUT";

    await handler(mockRequest, mockResponse, mockUserId, mockToken);

    expect(mockResponse._getStatusCode()).toBe(405);
    expect(mockResponse._getHeaders()).toHaveProperty("allow", ["GET", "POST", "PUT", "DELETE"]);
    expect(mockResponse._getJSONData()).toEqual({
      error: "Method PUT Not Allowed",
    });
  });
});
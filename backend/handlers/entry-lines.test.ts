import { describe, it, expect, vi, beforeEach } from "vitest";
import entryLinesHandler from "./entry-lines";
import type { VercelRequest, VercelResponse } from "@vercel/node";

interface MockRequest extends Partial<VercelRequest> {
  method: string;
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
}

interface MockResponse extends Partial<VercelResponse> {
  status: (code: number) => MockResponse;
  json: (data: unknown) => void;
  send?: (data: unknown) => void;
  setHeader?: (name: string, value: string | string[]) => void;
}

vi.mock("../utils/supabaseClient", async (importOriginal) => {
  const actual = await importOriginal<typeof supabaseClient>();

  const mockFrom = vi.fn();
  const mockSelect = vi.fn();
  const mockInsert = vi.fn();
  const mockUpdate = vi.fn();
  const mockDelete = vi.fn();
  const mockEq = vi.fn();
  const mockSingle = vi.fn();
  const mockLte = vi.fn();
  const mockOrder = vi.fn();
  const mockRpc = vi.fn();

  return {
    ...actual,
    getSupabaseClient: vi.fn(() => ({
      from: mockFrom,
      rpc: mockRpc,
    })),
    supabase: {
      from: mockFrom,
      rpc: mockRpc,
    },
    mockFrom,
    mockSelect,
    mockInsert,
    mockUpdate,
    mockDelete,
    mockEq,
    mockSingle,
    mockLte,
    mockOrder,
    mockRpc,
  };
});

vi.mock("../utils/schemas", () => ({
  createEntryLineSchema: {
    safeParse: vi.fn((data: unknown) => {
      if (
        data.journal_entry_id &&
        data.account_id &&
        (data.debit || data.credit)
      ) {
        return { success: true, data };
      }
      return {
        success: false,
        error: { errors: [{ message: "Invalid entry line data" }] },
      };
    }),
  },
}));

describe("entryLinesHandler", () => {
  let req: MockRequest;
  let res: MockResponse;
  const user_id = "test-user-id";
  const token = "test-token";

  beforeEach(() => {
    vi.clearAllMocks();
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      send: vi.fn(),
      setHeader: vi.fn(),
    };

    supabaseClient.mockFrom.mockReturnValue({
      select: supabaseClient.mockSelect,
      insert: supabaseClient.mockInsert,
      update: supabaseClient.mockUpdate,
      delete: supabaseClient.mockDelete,
    });
    supabaseClient.mockSelect.mockReturnValue({
      eq: supabaseClient.mockEq,
      order: supabaseClient.mockOrder,
      single: supabaseClient.mockSingle,
      lte: supabaseClient.mockLte,
    });
    supabaseClient.mockInsert.mockReturnValue({
      select: supabaseClient.mockSelect,
    });
    supabaseClient.mockUpdate.mockReturnValue({ eq: supabaseClient.mockEq });
    supabaseClient.mockDelete.mockReturnValue({ eq: supabaseClient.mockEq });
    supabaseClient.mockEq.mockReturnValue({
      order: supabaseClient.mockOrder,
      single: supabaseClient.mockSingle,
      lte: supabaseClient.mockLte,
    });
    supabaseClient.mockOrder.mockReturnValue({
      single: supabaseClient.mockSingle,
    });
  });

  it("should return entry lines for a given journal_entry_id", async () => {
    req = { method: "GET", query: { journal_entry_id: "journal-123" } };
    const mockData = [
      {
        id: "el1",
        journal_entry_id: "journal-123",
        account_id: "acc1",
        debit: 100,
      },
    ];
    mockEq.mockResolvedValueOnce({ data: mockData, error: null });

    await entryLinesHandler(req, res, user_id, token);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockData);
    expect(mockEq).toHaveBeenCalledWith("journal_entry_id", "journal-123");
  });

  it("should handle database errors when fetching entry lines by journal_entry_id", async () => {
    req = { method: "GET", query: { journal_entry_id: "journal-123" } };
    const dbError = new Error("DB fetch error");
    mockEq.mockResolvedValueOnce({ data: null, error: dbError });

    await entryLinesHandler(req, res, user_id, token);

    expect(handleErrorResponse).toHaveBeenCalledWith(
      res,
      500,
      "DB fetch error",
    );
  });

  it("should return all entry lines for the user when no journal_entry_id is provided", async () => {
    req = { method: "GET", query: {} };
    const mockData = [
      {
        id: "el2",
        journal_entry_id: "journal-456",
        account_id: "acc2",
        debit: 200,
      },
    ];
    mockEq.mockResolvedValueOnce({ data: mockData, error: null });

    await entryLinesHandler(req, res, user_id, token);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockData);
    expect(mockEq).toHaveBeenCalledWith("journal_entry_id.user_id", user_id);
  });

  it("should handle database errors when fetching all entry lines for the user", async () => {
    req = { method: "GET", query: {} };
    const dbError = new Error("DB fetch all error");
    mockEq.mockResolvedValueOnce({ data: null, error: dbError });

    await entryLinesHandler(req, res, user_id, token);

    expect(handleErrorResponse).toHaveBeenCalledWith(
      res,
      500,
      "DB fetch all error",
    );
  });

  it("should create a new entry line successfully", async () => {
    req = {
      method: "POST",
      body: {
        journal_entry_id: "journal-123",
        account_id: "acc1",
        debit: 100,
        credit: 0,
        product_id: null,
        quantity: null,
        unit_cost: null,
        total_gross: null,
        icms_value: null,
        total_net: null,
      },
    };
    const mockJournalEntry = { id: "journal-123" };
    const mockNewLine = {
      id: "new-el",
      journal_entry_id: "journal-123",
      account_id: "acc1",
      debit: 100,
    };

    mockSingle.mockResolvedValueOnce({ data: mockJournalEntry, error: null });
    mockInsert.mockReturnValue({
      select: vi
        .fn()
        .mockReturnValue({
          single: vi
            .fn()
            .mockResolvedValueOnce({ data: mockNewLine, error: null }),
        }),
    });

    await entryLinesHandler(req, res, user_id, token);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockNewLine);
    expect(mockInsert).toHaveBeenCalledWith([
      expect.objectContaining({ journal_entry_id: "journal-123" }),
    ]);
  });

  it("should return 400 for invalid request body (validation error)", async () => {
    req = { method: "POST", body: { journal_entry_id: "journal-123" } };

    await entryLinesHandler(req, res, user_id, token);

    expect(handleErrorResponse).toHaveBeenCalledWith(
      res,
      400,
      "Invalid entry line data",
    );
  });

  it("should return 403 if the user does not have permission for the journal_entry_id or it doesn't exist", async () => {
    req = {
      method: "POST",
      body: {
        journal_entry_id: "journal-invalid",
        account_id: "acc1",
        debit: 100,
        credit: 0,
      },
    };
    mockSingle.mockResolvedValueOnce({ data: null, error: null });

    await entryLinesHandler(req, res, user_id, token);

    expect(handleErrorResponse).toHaveBeenCalledWith(
      res,
      403,
      "Você não tem permissão para adicionar linhas a este lançamento diário ou ele não existe.",
    );
  });

  it("should handle database errors during insertion", async () => {
    req = {
      method: "POST",
      body: {
        journal_entry_id: "journal-123",
        account_id: "acc1",
        debit: 100,
        credit: 0,
      },
    };
    const mockJournalEntry = { id: "journal-123" };
    const insertError = new Error("Insert failed");

    mockSingle.mockResolvedValueOnce({ data: mockJournalEntry, error: null });
    mockInsert.mockReturnValue({
      select: vi
        .fn()
        .mockReturnValue({
          single: vi
            .fn()
            .mockResolvedValueOnce({ data: null, error: insertError }),
        }),
    });

    await entryLinesHandler(req, res, user_id, token);

    expect(handleErrorResponse).toHaveBeenCalledWith(res, 500, "Insert failed");
  });

  it("should update product stock when product_id and quantity are provided (purchase)", async () => {
    req = {
      method: "POST",
      body: {
        journal_entry_id: "journal-123",
        account_id: "acc1",
        debit: 100,
        credit: 0,
        product_id: "prod-1",
        quantity: 10,
        unit_cost: 10,
        total_gross: 100,
        icms_value: 0,
        total_net: 100,
      },
    };
    const mockJournalEntry = { id: "journal-123" };
    const mockNewLine = {
      id: "new-el",
      journal_entry_id: "journal-123",
      account_id: "acc1",
      debit: 100,
      product_id: "prod-1",
      quantity: 10,
    };
    const mockProduct = { current_stock: 50 };

    mockSingle.mockResolvedValueOnce({ data: mockJournalEntry, error: null });
    mockInsert.mockReturnValue({
      select: vi
        .fn()
        .mockReturnValue({
          single: vi
            .fn()
            .mockResolvedValueOnce({ data: mockNewLine, error: null }),
        }),
    });

    const mockProductSelect = vi.fn();
    const mockProductEq = vi.fn();
    mockFrom.mockImplementation((tableName: string) => {
      if (tableName === "products") {
        return {
          select: mockProductSelect,
          update: mockUpdate,
        };
      }
      return {
        select: mockSelect,
        insert: mockInsert,
        update: mockUpdate,
      };
    });
    mockProductSelect.mockReturnValue({ eq: mockProductEq });
    mockProductEq.mockReturnValue({
      eq: mockProductEq,
      single: vi.fn().mockResolvedValueOnce({ data: mockProduct, error: null }),
    });

    mockUpdate.mockReturnValue({
      eq: vi.fn().mockResolvedValueOnce({ data: null, error: null }),
    });

    await entryLinesHandler(req, res, user_id, token);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockNewLine);
    expect(mockUpdate).toHaveBeenCalledWith({ current_stock: 60 });
  });

  it("should update product stock when product_id and quantity are provided (sale)", async () => {
    req = {
      method: "POST",
      body: {
        journal_entry_id: "journal-123",
        account_id: "acc1",
        debit: 0,
        credit: 50,
        product_id: "prod-1",
        quantity: 5,
        unit_cost: 10,
        total_gross: 50,
        icms_value: 0,
        total_net: 50,
      },
    };
    const mockJournalEntry = { id: "journal-123" };
    const mockNewLine = {
      id: "new-el",
      journal_entry_id: "journal-123",
      account_id: "acc1",
      debit: 0,
      credit: 50,
      product_id: "prod-1",
      quantity: 5,
    };
    const mockProduct = { current_stock: 50 };

    mockSingle.mockResolvedValueOnce({ data: mockJournalEntry, error: null });
    mockInsert.mockReturnValue({
      select: vi
        .fn()
        .mockReturnValue({
          single: vi
            .fn()
            .mockResolvedValueOnce({ data: mockNewLine, error: null }),
        }),
    });

    const mockProductSelect = vi.fn();
    const mockProductEq = vi.fn();
    mockFrom.mockImplementation((tableName: string) => {
      if (tableName === "products") {
        return {
          select: mockProductSelect,
          update: mockUpdate,
        };
      }
      return {
        select: mockSelect,
        insert: mockInsert,
        update: mockUpdate,
      };
    });
    mockProductSelect.mockReturnValue({ eq: mockProductEq });
    mockProductEq.mockReturnValue({
      eq: mockProductEq,
      single: vi.fn().mockResolvedValueOnce({ data: mockProduct, error: null }),
    });

    mockUpdate.mockReturnValue({
      eq: vi.fn().mockResolvedValueOnce({ data: null, error: null }),
    });

    await entryLinesHandler(req, res, user_id, token);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockNewLine);
    expect(mockUpdate).toHaveBeenCalledWith({ current_stock: 45 });
  });

  it("should not update product stock if product_id or quantity is missing", async () => {
    req = {
      method: "POST",
      body: {
        journal_entry_id: "journal-123",
        account_id: "acc1",
        debit: 100,
        credit: 0,
        product_id: null,
        quantity: 10,
        unit_cost: 10,
        total_gross: 100,
        icms_value: 0,
        total_net: 100,
      },
    };
    const mockJournalEntry = { id: "journal-123" };
    const mockNewLine = {
      id: "new-el",
      journal_entry_id: "journal-123",
      account_id: "acc1",
      debit: 100,
      product_id: null,
      quantity: 10,
    };

    mockSingle.mockResolvedValueOnce({ data: mockJournalEntry, error: null });
    mockInsert.mockReturnValue({
      select: vi
        .fn()
        .mockReturnValue({
          single: vi
            .fn()
            .mockResolvedValueOnce({ data: mockNewLine, error: null }),
        }),
    });

    await entryLinesHandler(req, res, user_id, token);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockNewLine);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("should handle product not found during stock update", async () => {
    req = {
      method: "POST",
      body: {
        journal_entry_id: "journal-123",
        account_id: "acc1",
        debit: 100,
        credit: 0,
        product_id: "prod-not-found",
        quantity: 10,
        unit_cost: 10,
        total_gross: 100,
        icms_value: 0,
        total_net: 100,
      },
    };
    const mockJournalEntry = { id: "journal-123" };
    const mockNewLine = {
      id: "new-el",
      journal_entry_id: "journal-123",
      account_id: "acc1",
      debit: 100,
      product_id: "prod-not-found",
      quantity: 10,
    };

    mockSingle.mockResolvedValueOnce({ data: mockJournalEntry, error: null });
    mockInsert.mockReturnValue({
      select: vi
        .fn()
        .mockReturnValue({
          single: vi
            .fn()
            .mockResolvedValueOnce({ data: mockNewLine, error: null }),
        }),
    });

    const mockProductSelect = vi.fn();
    const mockProductEq = vi.fn();
    mockFrom.mockImplementation((tableName: string) => {
      if (tableName === "products") {
        return {
          select: mockProductSelect,
          update: mockUpdate,
        };
      }
      return {
        select: mockSelect,
        insert: mockInsert,
        update: mockUpdate,
      };
    });
    mockProductSelect.mockReturnValue({ eq: mockProductEq });
    mockProductEq.mockReturnValue({
      eq: mockProductEq,
      single: vi.fn().mockResolvedValueOnce({ data: null, error: null }),
    });

    await entryLinesHandler(req, res, user_id, token);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockNewLine);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("should handle unexpected errors", async () => {
    req = { method: "GET", query: {} };
    const dbError = new Error("Unexpected DB error");
    mockEq.mockRejectedValueOnce(dbError);

    await entryLinesHandler(req, res, user_id, token);

    expect(handleErrorResponse).toHaveBeenCalledWith(
      res,
      500,
      "Unexpected DB error",
    );
  });

  describe("Tax Calculation Logic", () => {
    const commonMocks = () => {
      const mockJournalEntry = { id: "journal-123" };
      mockSingle.mockResolvedValueOnce({ data: mockJournalEntry, error: null });

      const mockAccounts = [
        { id: "revenue-acc", name: "Receita de Vendas" },
        { id: "ipi-payable-acc", name: "IPI a Recolher" },
        { id: "icms-payable-acc", name: "ICMS a Recolher" },
        { id: "icms-st-payable-acc", name: "ICMS-ST a Recolher" },
        { id: "pis-payable-acc", name: "PIS a Recolher" },
        { id: "cofins-payable-acc", name: "COFINS a Recolher" },
        { id: "cmv-acc", name: "Custo da Mercadoria Vendida" },
        {
          id: "finished-goods-stock-acc",
          name: "Estoque de Produtos Acabados",
        },
        { id: "pis-expense-acc", name: "PIS sobre Faturamento" },
        { id: "cofins-expense-acc", name: "COFINS sobre Faturamento" },
        { id: "merchandise-stock-acc", name: "Estoque de Mercadorias" },
        { id: "suppliers-acc", name: "Fornecedores" },
      ];
      mockEq.mockResolvedValueOnce({ data: mockAccounts, error: null });
    };

    it("should correctly calculate taxes for a sale transaction with all taxes", async () => {
      commonMocks();
      req = {
        method: "POST",
        body: {
          journal_entry_id: "journal-123",
          account_id: "client-acc",
          debit: null,
          credit: null,
          product_id: "prod-1",
          quantity: 10,
          unit_cost: 50,
          total_gross: 500, // 10 * 50
          icms_rate: 18,
          ipi_rate: 10,
          pis_rate: 1.65,
          cofins_rate: 7.6,
          mva_rate: 30,
          transaction_type: "sale",
        },
      };

      const expectedIPI = 500 * 0.1; // 50
      const baseICMS_PIS_COFINS = 500 + expectedIPI; // 550
      const expectedICMS = baseICMS_PIS_COFINS * 0.18; // 99
      const expectedPIS = 500 * 0.0165; // 8.25
      const expectedCOFINS = 500 * 0.076; // 38
      const baseICMS_ST = baseICMS_PIS_COFINS * (1 + 0.3); // 550 * 1.3 = 715
      const icmsSTTotal = baseICMS_ST * 0.18; // 715 * 0.18 = 128.7
      const expectedICMS_ST = icmsSTTotal - expectedICMS; // 128.7 - 99 = 29.7
      const expectedTotalNet = 500 + expectedIPI + expectedICMS_ST; // 500 + 50 + 29.7 = 579.7

      const mockNewLine = {
        id: "new-el",
        journal_entry_id: "journal-123",
        account_id: "client-acc",
        debit: expectedTotalNet,
        credit: null,
      };
      mockInsert.mockReturnValue({
        select: vi
          .fn()
          .mockResolvedValueOnce({ data: [mockNewLine], error: null }),
      });

      await entryLinesHandler(req, res, user_id, token);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(mockInsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            account_id: "client-acc",
            debit: expectedTotalNet,
            credit: null,
            icms_value: expectedICMS,
            ipi_value: expectedIPI,
            pis_value: expectedPIS,
            cofins_value: expectedCOFINS,
            icms_st_value: expectedICMS_ST,
            total_net: expectedTotalNet,
          }),
          expect.objectContaining({
            account_id: "revenue-acc",
            debit: null,
            credit: 500,
          }),
          expect.objectContaining({
            account_id: "ipi-payable-acc",
            debit: null,
            credit: expectedIPI,
          }),
          expect.objectContaining({
            account_id: "revenue-acc",
            debit: expectedICMS,
            credit: null,
          }),
          expect.objectContaining({
            account_id: "icms-payable-acc",
            debit: null,
            credit: expectedICMS,
          }),
          expect.objectContaining({
            account_id: "icms-st-payable-acc",
            debit: null,
            credit: expectedICMS_ST,
          }),
          expect.objectContaining({
            account_id: "pis-expense-acc",
            debit: expectedPIS,
            credit: null,
          }),
          expect.objectContaining({
            account_id: "pis-payable-acc",
            debit: null,
            credit: expectedPIS,
          }),
          expect.objectContaining({
            account_id: "cofins-expense-acc",
            debit: expectedCOFINS,
            credit: null,
          }),
          expect.objectContaining({
            account_id: "cofins-payable-acc",
            debit: null,
            credit: expectedCOFINS,
          }),
          expect.objectContaining({
            account_id: "cmv-acc",
            debit: 500,
            credit: null,
          }),
          expect.objectContaining({
            account_id: "finished-goods-stock-acc",
            debit: null,
            credit: 500,
          }),
        ]),
      );
    });

    it("should correctly calculate taxes for a purchase transaction", async () => {
      commonMocks();
      req = {
        method: "POST",
        body: {
          journal_entry_id: "journal-123",
          account_id: "supplier-acc",
          debit: null,
          credit: null,
          product_id: "prod-2",
          quantity: 20,
          unit_cost: 25,
          total_gross: 500, // 20 * 25
          transaction_type: "purchase",
          total_net: 500, // Assuming total_net is provided for purchase
        },
      };

      const mockNewLine = {
        id: "new-el",
        journal_entry_id: "journal-123",
        account_id: "merchandise-stock-acc",
        debit: 500,
        credit: null,
      };
      mockInsert.mockReturnValue({
        select: vi
          .fn()
          .mockResolvedValueOnce({ data: [mockNewLine], error: null }),
      });

      await entryLinesHandler(req, res, user_id, token);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(mockInsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            account_id: "merchandise-stock-acc",
            debit: 500,
            credit: null,
            total_net: 500,
          }),
          expect.objectContaining({
            account_id: "suppliers-acc",
            debit: null,
            credit: 500,
          }),
        ]),
      );
    });
  });
});

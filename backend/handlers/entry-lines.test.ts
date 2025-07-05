import { describe, it, expect, vi, beforeEach } from 'vitest';
import entryLinesHandler from './entry-lines';
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



vi.mock('../utils/supabaseClient', async (importOriginal) => {
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
    mockFrom, mockSelect, mockInsert, mockUpdate, mockDelete, mockEq, mockSingle, mockLte, mockOrder, mockRpc
  };
});

vi.mock('../utils/schemas', () => ({
  createEntryLineSchema: {
    safeParse: vi.fn((data: unknown) => {
      if (data.journal_entry_id && data.account_id && (data.debit || data.credit)) {
        return { success: true, data };
      }
      return { success: false, error: { errors: [{ message: 'Invalid entry line data' }] } };
    }),
  },
}));

describe('entryLinesHandler', () => {
  let req: MockRequest;
  let res: MockResponse;
  const user_id = 'test-user-id';
  const token = 'test-token';

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
    supabaseClient.mockSelect.mockReturnValue({ eq: supabaseClient.mockEq, order: supabaseClient.mockOrder, single: supabaseClient.mockSingle, lte: supabaseClient.mockLte });
    supabaseClient.mockInsert.mockReturnValue({ select: supabaseClient.mockSelect });
    supabaseClient.mockUpdate.mockReturnValue({ eq: supabaseClient.mockEq });
    supabaseClient.mockDelete.mockReturnValue({ eq: supabaseClient.mockEq });
    supabaseClient.mockEq.mockReturnValue({ order: supabaseClient.mockOrder, single: supabaseClient.mockSingle, lte: supabaseClient.mockLte });
    supabaseClient.mockOrder.mockReturnValue({ single: supabaseClient.mockSingle });
  });

  it('should return entry lines for a given journal_entry_id', async () => {
    req = { method: 'GET', query: { journal_entry_id: 'journal-123' } };
    const mockData = [{ id: 'el1', journal_entry_id: 'journal-123', account_id: 'acc1', debit: 100 }];
    mockEq.mockResolvedValueOnce({ data: mockData, error: null });

    await entryLinesHandler(req, res, user_id, token);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockData);
    expect(mockEq).toHaveBeenCalledWith('journal_entry_id', 'journal-123');
  });

  it('should handle database errors when fetching entry lines by journal_entry_id', async () => {
    req = { method: 'GET', query: { journal_entry_id: 'journal-123' } };
    const dbError = new Error('DB fetch error');
    mockEq.mockResolvedValueOnce({ data: null, error: dbError });

    await entryLinesHandler(req, res, user_id, token);

    expect(handleErrorResponse).toHaveBeenCalledWith(res, 500, 'DB fetch error');
  });

  it('should return all entry lines for the user when no journal_entry_id is provided', async () => {
    req = { method: 'GET', query: {} };
    const mockData = [{ id: 'el2', journal_entry_id: 'journal-456', account_id: 'acc2', debit: 200 }];
    mockEq.mockResolvedValueOnce({ data: mockData, error: null });

    await entryLinesHandler(req, res, user_id, token);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockData);
    expect(mockEq).toHaveBeenCalledWith('journal_entry_id.user_id', user_id);
  });

  it('should handle database errors when fetching all entry lines for the user', async () => {
    req = { method: 'GET', query: {} };
    const dbError = new Error('DB fetch all error');
    mockEq.mockResolvedValueOnce({ data: null, error: dbError });

    await entryLinesHandler(req, res, user_id, token);

    expect(handleErrorResponse).toHaveBeenCalledWith(res, 500, 'DB fetch all error');
  });

  it('should create a new entry line successfully', async () => {
    req = {
      method: 'POST',
      body: {
        journal_entry_id: 'journal-123',
        account_id: 'acc1',
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
    const mockJournalEntry = { id: 'journal-123' };
    const mockNewLine = { id: 'new-el', journal_entry_id: 'journal-123', account_id: 'acc1', debit: 100 };

    mockSingle.mockResolvedValueOnce({ data: mockJournalEntry, error: null });
    mockInsert.mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValueOnce({ data: mockNewLine, error: null }) }) });

    await entryLinesHandler(req, res, user_id, token);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockNewLine);
    expect(mockInsert).toHaveBeenCalledWith([expect.objectContaining({ journal_entry_id: 'journal-123' })]);
  });

  it('should return 400 for invalid request body (validation error)', async () => {
    req = { method: 'POST', body: { journal_entry_id: 'journal-123' } };

    await entryLinesHandler(req, res, user_id, token);

    expect(handleErrorResponse).toHaveBeenCalledWith(res, 400, 'Invalid entry line data');
  });

  it("should return 403 if the user does not have permission for the journal_entry_id or it doesn't exist", async () => {
    req = {
      method: 'POST',
      body: {
        journal_entry_id: 'journal-invalid',
        account_id: 'acc1',
        debit: 100,
        credit: 0,
      },
    };
    mockSingle.mockResolvedValueOnce({ data: null, error: null });

    await entryLinesHandler(req, res, user_id, token);

    expect(handleErrorResponse).toHaveBeenCalledWith(res, 403, 'Você não tem permissão para adicionar linhas a este lançamento diário ou ele não existe.');
  });

  it('should handle database errors during insertion', async () => {
    req = {
      method: 'POST',
      body: {
        journal_entry_id: 'journal-123',
        account_id: 'acc1',
        debit: 100,
        credit: 0,
      },
    };
    const mockJournalEntry = { id: 'journal-123' };
    const insertError = new Error('Insert failed');

    mockSingle.mockResolvedValueOnce({ data: mockJournalEntry, error: null });
    mockInsert.mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValueOnce({ data: null, error: insertError }) }) });

    await entryLinesHandler(req, res, user_id, token);

    expect(handleErrorResponse).toHaveBeenCalledWith(res, 500, 'Insert failed');
  });

  it('should update product stock when product_id and quantity are provided (purchase)', async () => {
    req = {
      method: 'POST',
      body: {
        journal_entry_id: 'journal-123',
        account_id: 'acc1',
        debit: 100,
        credit: 0,
        product_id: 'prod-1',
        quantity: 10,
        unit_cost: 10,
        total_gross: 100,
        icms_value: 0,
        total_net: 100,
      },
    };
    const mockJournalEntry = { id: 'journal-123' };
    const mockNewLine = { id: 'new-el', journal_entry_id: 'journal-123', account_id: 'acc1', debit: 100, product_id: 'prod-1', quantity: 10 };
    const mockProduct = { current_stock: 50 };

    mockSingle.mockResolvedValueOnce({ data: mockJournalEntry, error: null });
    mockInsert.mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValueOnce({ data: mockNewLine, error: null }) }) });

    const mockProductSelect = vi.fn();
    const mockProductEq = vi.fn();
    mockFrom.mockImplementation((tableName: string) => {
      if (tableName === 'products') {
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
    mockProductEq.mockReturnValue({ eq: mockProductEq, single: vi.fn().mockResolvedValueOnce({ data: mockProduct, error: null }) });

    mockUpdate.mockReturnValue({ eq: vi.fn().mockResolvedValueOnce({ data: null, error: null }) });

    await entryLinesHandler(req, res, user_id, token);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockNewLine);
    expect(mockUpdate).toHaveBeenCalledWith({ current_stock: 60 });
  });

  it('should update product stock when product_id and quantity are provided (sale)', async () => {
    req = {
      method: 'POST',
      body: {
        journal_entry_id: 'journal-123',
        account_id: 'acc1',
        debit: 0,
        credit: 50,
        product_id: 'prod-1',
        quantity: 5,
        unit_cost: 10,
        total_gross: 50,
        icms_value: 0,
        total_net: 50,
      },
    };
    const mockJournalEntry = { id: 'journal-123' };
    const mockNewLine = { id: 'new-el', journal_entry_id: 'journal-123', account_id: 'acc1', debit: 0, credit: 50, product_id: 'prod-1', quantity: 5 };
    const mockProduct = { current_stock: 50 };

    mockSingle.mockResolvedValueOnce({ data: mockJournalEntry, error: null });
    mockInsert.mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValueOnce({ data: mockNewLine, error: null }) }) });

    const mockProductSelect = vi.fn();
    const mockProductEq = vi.fn();
    mockFrom.mockImplementation((tableName: string) => {
      if (tableName === 'products') {
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
    mockProductEq.mockReturnValue({ eq: mockProductEq, single: vi.fn().mockResolvedValueOnce({ data: mockProduct, error: null }) });

    mockUpdate.mockReturnValue({ eq: vi.fn().mockResolvedValueOnce({ data: null, error: null }) });

    await entryLinesHandler(req, res, user_id, token);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockNewLine);
    expect(mockUpdate).toHaveBeenCalledWith({ current_stock: 45 });
  });

  it('should not update product stock if product_id or quantity is missing', async () => {
    req = {
      method: 'POST',
      body: {
        journal_entry_id: 'journal-123',
        account_id: 'acc1',
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
    const mockJournalEntry = { id: 'journal-123' };
    const mockNewLine = { id: 'new-el', journal_entry_id: 'journal-123', account_id: 'acc1', debit: 100, product_id: null, quantity: 10 };

    mockSingle.mockResolvedValueOnce({ data: mockJournalEntry, error: null });
    mockInsert.mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValueOnce({ data: mockNewLine, error: null }) }) });

    await entryLinesHandler(req, res, user_id, token);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockNewLine);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('should handle product not found during stock update', async () => {
    req = {
      method: 'POST',
      body: {
        journal_entry_id: 'journal-123',
        account_id: 'acc1',
        debit: 100,
        credit: 0,
        product_id: 'prod-not-found',
        quantity: 10,
        unit_cost: 10,
        total_gross: 100,
        icms_value: 0,
        total_net: 100,
      },
    };
    const mockJournalEntry = { id: 'journal-123' };
    const mockNewLine = { id: 'new-el', journal_entry_id: 'journal-123', account_id: 'acc1', debit: 100, product_id: 'prod-not-found', quantity: 10 };

    mockSingle.mockResolvedValueOnce({ data: mockJournalEntry, error: null });
    mockInsert.mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValueOnce({ data: mockNewLine, error: null }) }) });

    const mockProductSelect = vi.fn();
    const mockProductEq = vi.fn();
    mockFrom.mockImplementation((tableName: string) => {
      if (tableName === 'products') {
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
    mockProductEq.mockReturnValue({ eq: mockProductEq, single: vi.fn().mockResolvedValueOnce({ data: null, error: null }) });

    await entryLinesHandler(req, res, user_id, token);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockNewLine);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('should return 405 for unsupported methods', async () => {
    req = { method: 'PUT' };
    await entryLinesHandler(req, res, user_id, token);

    expect(res.setHeader).toHaveBeenCalledWith('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    expect(handleErrorResponse).toHaveBeenCalledWith(res, 405, 'Method PUT Not Allowed');
  });

  it('should handle unexpected errors', async () => {
    req = { method: 'GET', query: {} };
    const dbError = new Error('Unexpected DB error');
    mockEq.mockRejectedValueOnce(dbError);

    await entryLinesHandler(req, res, user_id, token);

    expect(handleErrorResponse).toHaveBeenCalledWith(res, 500, 'Unexpected DB error');
  });
});
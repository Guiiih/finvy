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

vi.mock('../utils/supabaseClient', () => {
  mockFrom = vi.fn();
  mockSelect = vi.fn();
  mockInsert = vi.fn();
  mockUpdate = vi.fn();
  mockEq = vi.fn();
  mockSingle = vi.fn();
  mockLte = vi.fn(); // For .lte() in GET requests

  return {
    getSupabaseClient: vi.fn(() => ({
      from: mockFrom,
    })),
    supabase: {
      from: mockFrom, // Both getSupabaseClient and supabase use the same mockFrom
    },
    handleErrorResponse: vi.fn((res: MockResponse, status: number, message: string) => {
      res.status(status).json({ error: message });
    }),
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

    // Clear and reset mocks
    mockFrom.mockClear();
    mockSelect.mockClear();
    mockInsert.mockClear();
    mockUpdate.mockClear();
    mockEq.mockClear();
    mockSingle.mockClear();
    mockLte.mockClear();

    // Default chaining for common operations
    mockFrom.mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
    });
    mockSelect.mockReturnValue({ eq: mockEq, single: mockSingle });
    mockEq.mockReturnValue({ single: mockSingle, eq: mockEq, lte: mockLte });
    mockLte.mockReturnValue({ data: [], error: null }); // Default for lte
    mockInsert.mockReturnValue({ select: mockSelect });
    mockUpdate.mockReturnValue({ eq: mockEq });
  });

  // --- GET Requests ---
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
    mockEq.mockResolvedValueOnce({ data: mockData, error: null }); // For the .eq("journal_entry_id.user_id", user_id) call

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

  // --- POST Requests ---
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

    mockSingle.mockResolvedValueOnce({ data: mockJournalEntry, error: null }); // For journal entry permission check
    mockInsert.mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValueOnce({ data: mockNewLine, error: null }) }) }); // For insert operation

    await entryLinesHandler(req, res, user_id, token);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockNewLine);
    expect(mockInsert).toHaveBeenCalledWith([expect.objectContaining({ journal_entry_id: 'journal-123' })]);
  });

  it('should return 400 for invalid request body (validation error)', async () => {
    req = { method: 'POST', body: { journal_entry_id: 'journal-123' } }; // Missing account_id and debit/credit

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
    mockSingle.mockResolvedValueOnce({ data: null, error: null }); // Simulate journal entry not found or no permission

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

    mockSingle.mockResolvedValueOnce({ data: mockJournalEntry, error: null }); // For journal entry permission check
    mockInsert.mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValueOnce({ data: null, error: insertError }) }) }); // Simulate insert error

    await entryLinesHandler(req, res, user_id, token);

    expect(handleErrorResponse).toHaveBeenCalledWith(res, 500, 'Insert failed');
  });

  it('should update product stock when product_id and quantity are provided (purchase)', async () => {
    req = {
      method: 'POST',
      body: {
        journal_entry_id: 'journal-123',
        account_id: 'acc1',
        debit: 100, // Indicates purchase
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

    mockSingle.mockResolvedValueOnce({ data: mockJournalEntry, error: null }); // Journal entry permission
    mockInsert.mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValueOnce({ data: mockNewLine, error: null }) }) }); // Insert entry line

    // Mock for product fetch
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

    // Mock for product update
    mockUpdate.mockReturnValue({ eq: vi.fn().mockResolvedValueOnce({ data: null, error: null }) });

    await entryLinesHandler(req, res, user_id, token);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockNewLine);
    expect(mockUpdate).toHaveBeenCalledWith({ current_stock: 60 }); // 50 + 10
  });

  it('should update product stock when product_id and quantity are provided (sale)', async () => {
    req = {
      method: 'POST',
      body: {
        journal_entry_id: 'journal-123',
        account_id: 'acc1',
        debit: 0,
        credit: 50, // Indicates sale
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

    mockSingle.mockResolvedValueOnce({ data: mockJournalEntry, error: null }); // Journal entry permission
    mockInsert.mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValueOnce({ data: mockNewLine, error: null }) }) }); // Insert entry line

    // Mock for product fetch
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

    // Mock for product update
    mockUpdate.mockReturnValue({ eq: vi.fn().mockResolvedValueOnce({ data: null, error: null }) });

    await entryLinesHandler(req, res, user_id, token);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockNewLine);
    expect(mockUpdate).toHaveBeenCalledWith({ current_stock: 45 }); // 50 - 5
  });

  it('should not update product stock if product_id or quantity is missing', async () => {
    req = {
      method: 'POST',
      body: {
        journal_entry_id: 'journal-123',
        account_id: 'acc1',
        debit: 100,
        credit: 0,
        product_id: null, // Missing product_id
        quantity: 10,
        unit_cost: 10,
        total_gross: 100,
        icms_value: 0,
        total_net: 100,
      },
    };
    const mockJournalEntry = { id: 'journal-123' };
    const mockNewLine = { id: 'new-el', journal_entry_id: 'journal-123', account_id: 'acc1', debit: 100, product_id: null, quantity: 10 };

    mockSingle.mockResolvedValueOnce({ data: mockJournalEntry, error: null }); // Journal entry permission
    mockInsert.mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValueOnce({ data: mockNewLine, error: null }) }) }); // Insert entry line

    await entryLinesHandler(req, res, user_id, token);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockNewLine);
    expect(mockUpdate).not.toHaveBeenCalled(); // Stock update should not be called
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

    mockSingle.mockResolvedValueOnce({ data: mockJournalEntry, error: null }); // Journal entry permission
    mockInsert.mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValueOnce({ data: mockNewLine, error: null }) }) }); // Insert entry line

    // Mock for product fetch (not found)
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
    expect(mockUpdate).not.toHaveBeenCalled(); // Stock update should not be called
  });

  // --- General ---
  it('should return 405 for unsupported methods', async () => {
    req = { method: 'PUT' }; // PUT is not fully implemented in the handler
    await entryLinesHandler(req, res, user_id, token);

    expect(res.setHeader).toHaveBeenCalledWith('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    expect(handleErrorResponse).toHaveBeenCalledWith(res, 405, 'Method PUT Not Allowed');
  });

  it('should handle unexpected errors', async () => {
    req = { method: 'GET', query: {} };
    const dbError = new Error('Unexpected DB error');
    mockEq.mockRejectedValueOnce(dbError); // Simulate an error at the first Supabase call

    await entryLinesHandler(req, res, user_id, token);

    expect(handleErrorResponse).toHaveBeenCalledWith(res, 500, 'Unexpected DB error');
  });
});

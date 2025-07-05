import { describe, it, expect, vi, beforeEach } from 'vitest';
import financialTransactionsHandler from './financial-transactions';
import * as supabaseClient from '../utils/supabaseClient';
import * as schemas from '../utils/schemas';
import type { VercelRequest, VercelResponse } from "@vercel/node";

interface MockRequest extends Partial<VercelRequest> {
  method: string;
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
}

interface MockResponse extends Partial<VercelResponse> {
  status: vi.Mock;
  json: vi.Mock;
  send?: vi.Mock;
  setHeader?: vi.Mock;
  end?: vi.Mock;
}



vi.mock('../utils/supabaseClient', async (importOriginal) => {
  const actual = await importOriginal<typeof supabaseClient>();

  const mockFrom = vi.fn();
  const mockSelect = vi.fn();
  const mockInsert = vi.fn();
  const mockUpdate = vi.fn();
  const mockDelete = vi.fn();
  const mockEq = vi.fn();
  const mockOrder = vi.fn();
  const mockSingle = vi.fn();
  const mockRpc = vi.fn();

  return {
    ...actual,
    getSupabaseClient: vi.fn(() => ({
      from: mockFrom,
      rpc: mockRpc,
    })),
    handleErrorResponse: vi.fn((res: MockResponse, status: number, message: string) => {
      res.status(status).json({ error: message });
    }),
    supabase: {
      from: mockFrom,
      rpc: mockRpc,
    },
    mockFrom, mockSelect, mockInsert, mockUpdate, mockDelete, mockEq, mockOrder, mockSingle, mockRpc
  };
});

vi.mock('../utils/schemas', async (importOriginal) => {
  const actual = await importOriginal<typeof schemas>();
  return {
    ...actual,
    createFinancialTransactionSchema: {
      safeParse: vi.fn((data: { amount: number, description: string }) => {
        if (data.amount && data.description) {
          return { success: true, data };
        }
        return { success: false, error: { errors: [{ message: 'Invalid data' }] } };
      }),
    },
  };
});

describe('financialTransactionsHandler', () => {
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
      end: vi.fn(),
    };

    // Setup chainable mocks
    supabaseClient.mockFrom.mockReturnValue({
      select: supabaseClient.mockSelect,
      insert: supabaseClient.mockInsert,
      update: supabaseClient.mockUpdate,
      delete: supabaseClient.mockDelete,
    });
    supabaseClient.mockSelect.mockReturnValue({ eq: supabaseClient.mockEq, order: supabaseClient.mockOrder, single: supabaseClient.mockSingle });
    supabaseClient.mockEq.mockReturnValue({ order: supabaseClient.mockOrder, single: supabaseClient.mockSingle });
    supabaseClient.mockOrder.mockReturnValue({ single: supabaseClient.mockSingle });
  });

  it('should return accounts payable for GET requests', async () => {
    req = { method: 'GET', query: { type: 'payable' } };
    const mockData = [{ id: 'ap1', amount: 100, user_id }];
    vi.mocked(supabaseClient.mockSelect).mockResolvedValueOnce({ data: mockData, error: null });

    await financialTransactionsHandler(req, res, user_id, token);

    expect(vi.mocked(supabaseClient.mockFrom)).toHaveBeenCalledWith('accounts_payable');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockData);
  });

  it('should return accounts receivable for GET requests', async () => {
    req = { method: 'GET', query: { type: 'receivable' } };
    const mockData = [{ id: 'ar1', amount: 200, user_id }];
    vi.mocked(supabaseClient.mockSelect).mockResolvedValueOnce({ data: mockData, error: null });

    await financialTransactionsHandler(req, res, user_id, token);

    expect(vi.mocked(supabaseClient.mockFrom)).toHaveBeenCalledWith('accounts_receivable');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockData);
  });

  it('should create a new accounts payable for POST requests', async () => {
    req = { method: 'POST', query: { type: 'payable' }, body: { amount: 150, description: 'New Payable' } };
    const mockData = { id: 'new-ap', amount: 150, description: 'New Payable', user_id };
    vi.mocked(supabaseClient.mockSingle).mockResolvedValueOnce({ data: mockData, error: null });

    await financialTransactionsHandler(req, res, user_id, token);

    expect(vi.mocked(supabaseClient.mockFrom)).toHaveBeenCalledWith('accounts_payable');
    expect(vi.mocked(supabaseClient.mockInsert)).toHaveBeenCalledWith([expect.objectContaining({ amount: 150, description: 'New Payable' })]);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockData);
  });

  it('should create a new accounts receivable for POST requests', async () => {
    req = { method: 'POST', query: { type: 'receivable' }, body: { amount: 250, description: 'New Receivable' } };
    const mockData = { id: 'new-ar', amount: 250, description: 'New Receivable', user_id };
    vi.mocked(supabaseClient.mockSingle).mockResolvedValueOnce({ data: mockData, error: null });

    await financialTransactionsHandler(req, res, user_id, token);

    expect(vi.mocked(supabaseClient.mockFrom)).toHaveBeenCalledWith('accounts_receivable');
    expect(vi.mocked(supabaseClient.mockInsert)).toHaveBeenCalledWith([expect.objectContaining({ amount: 250, description: 'New Receivable' })]);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockData);
  });

  it('should return 400 for invalid POST body', async () => {
    req = { method: 'POST', query: { type: 'payable' }, body: { amount: '' } }; // Invalid body
    vi.mocked(schemas.createFinancialTransactionSchema.safeParse).mockReturnValueOnce({ success: false, error: { errors: [{ message: 'Invalid data' }] } });

    await financialTransactionsHandler(req, res, user_id, token);

    expect(vi.mocked(supabaseClient.handleErrorResponse)).toHaveBeenCalledWith(res, 400, expect.any(String));
  });

  it('should return 405 for unsupported methods', async () => {
    req = { method: 'PUT', query: { type: 'payable' } }; // PUT is not implemented, but type is needed
    await financialTransactionsHandler(req, res, user_id, token);

    expect(res.setHeader).toHaveBeenCalledWith('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    expect(vi.mocked(supabaseClient.handleErrorResponse)).toHaveBeenCalledWith(res, 405, 'Method PUT Not Allowed');
  });

  it('should handle unexpected errors', async () => {
    req = { method: 'GET', query: { type: 'payable' } };
    const dbError = new Error('Unexpected DB error');
    vi.mocked(supabaseClient.mockOrder).mockRejectedValueOnce(dbError);

    await financialTransactionsHandler(req, res, user_id, token);

    expect(vi.mocked(supabaseClient.handleErrorResponse)).toHaveBeenCalledWith(res, 500, 'Unexpected DB error');
  });
});
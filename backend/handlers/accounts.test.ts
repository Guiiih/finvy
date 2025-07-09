import { describe, it, expect, vi, beforeEach } from 'vitest';
import accountsHandler from './accounts';
import * as supabaseClient from '../utils/supabaseClient';
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

vi.mock('../utils/schemas', () => ({
  createAccountSchema: {
    safeParse: vi.fn((data: { name: string, type: string }) => {
      if (data.name && data.type) {
        return { success: true, data };
      }
      return { success: false, error: { errors: [{ message: 'Invalid data' }] } };
    }),
  },
  updateAccountSchema: {
    safeParse: vi.fn((data: { name?: string, type?: string }) => {
      if (data.name || data.type) {
        return { success: true, data };
      }
      return { success: false, error: { errors: [{ message: 'Invalid data' }] } };
    }),
  },
  uuidSchema: {
    safeParse: vi.fn((id: string) => {
      if (id === '123' || id === 'new-id') {
        return { success: true, data: id };
      }
      return { success: false, error: { errors: [{ message: 'Invalid UUID' }] } };
    }),
  },
}));

describe('accountsHandler', () => {
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
    supabaseClient.mockSelect.mockReturnValue({ eq: supabaseClient.mockEq, order: supabaseClient.mockOrder, single: supabaseClient.mockSingle });
    supabaseClient.mockEq.mockReturnValue({ order: supabaseClient.mockOrder, single: supabaseClient.mockSingle });
    supabaseClient.mockOrder.mockReturnValue({ single: supabaseClient.mockSingle });
  });

  it('should return accounts for GET requests', async () => {
    req = { method: 'GET', query: {} };
    const mockData = [{ id: '123', name: 'Test Account', user_id }];
    supabaseClient.mockEq.mockResolvedValueOnce({ data: mockData, error: null });

    await accountsHandler(req, res, user_id, token);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockData);
  });

  it('should create a new account for POST requests', async () => {
    req = { method: 'POST', body: { name: 'New Account', type: 'asset' } };
    const mockData = { id: 'new-id', name: 'New Account', type: 'asset', user_id };
    supabaseClient.mockInsert.mockReturnValue({ select: vi.fn().mockResolvedValueOnce({ data: [mockData], error: null }) });

    await accountsHandler(req, res, user_id, token);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockData);
  });

  it('should update an existing account for PUT requests', async () => {
    req = { method: 'PUT', query: { id: '123' }, body: { name: 'Updated Account' } };
    const mockData = { id: '123', name: 'Updated Account', user_id };
    supabaseClient.mockSelect.mockResolvedValueOnce({ data: [mockData], error: null });

    await accountsHandler(req, res, user_id, token);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockData);
  });

  it('should delete an account for DELETE requests', async () => {
    req = { method: 'DELETE', query: { id: '123' } };
    supabaseClient.mockEq.mockReturnValue({ eq: supabaseClient.mockEq, select: supabaseClient.mockSelect, order: vi.fn().mockReturnThis(), single: vi.fn() });

    await accountsHandler(req, res, user_id, token);

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalledWith('');
  });

  it('should return 404 if account not found for PUT', async () => {
    req = { method: 'PUT', query: { id: '123' }, body: { name: 'Updated Account' } };
    supabaseClient.mockSelect.mockResolvedValueOnce({ data: [], error: null }); // Simulate not found

    await accountsHandler(req, res, user_id, token);

    expect(handleErrorResponse).toHaveBeenCalledWith(res, 404, 'Conta não encontrada ou você não tem permissão para atualizar esta conta.');
  });

  it('should return 404 if account not found for DELETE', async () => {
    req = { method: 'DELETE', query: { id: '123' } };
    supabaseClient.mockEq.mockReturnValue({ eq: vi.fn().mockResolvedValue({ count: 0, error: null }) });

    await accountsHandler(req, res, user_id, token);

    expect(handleErrorResponse).toHaveBeenCalledWith(res, 404, 'Conta não encontrada ou você não tem permissão para deletar esta conta.');
  });

  it('should return 405 for unsupported methods', async () => {
    req = { method: 'PATCH' };
    await accountsHandler(req, res, user_id, token);

    expect(res.setHeader).toHaveBeenCalledWith('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    expect(supabaseClient.handleErrorResponse).toHaveBeenCalledWith(res, 405, 'Method PATCH Not Allowed');
  });

  it('should handle unexpected errors', async () => {
    req = { method: 'GET', query: {} };
    const dbError = new Error('Unexpected DB error');
    supabaseClient.mockEq.mockRejectedValueOnce(dbError);

    await accountsHandler(req, res, user_id, token);

    expect(supabaseClient.handleErrorResponse).toHaveBeenCalledWith(res, 500, 'TypeError: userSupabase.from(...).select(...).eq(...).order is not a function');
  });
});
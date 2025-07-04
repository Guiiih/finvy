import { describe, it, expect, vi, beforeEach } from 'vitest';
import accountsHandler from './accounts';
import { getSupabaseClient, handleErrorResponse } from '../utils/supabaseClient';

interface MockRequest {
  method: string;
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
}

interface MockResponse {
  status: (code: number) => MockResponse;
  json: (data: unknown) => void;
  send?: (data: unknown) => void;
  setHeader?: (name: string, value: string | string[]) => void;
}

// Mock functions for Supabase client
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockEq = vi.fn();

vi.mock('../utils/supabaseClient', () => ({
  getSupabaseClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
    })),
  })),
  handleErrorResponse: vi.fn((res: MockResponse, status: number, message: string) => {
    res.status(status).json({ error: message });
  }),
}));

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
    // Setup chainable mocks
    mockSelect.mockReturnValue({ eq: mockEq });
    mockUpdate.mockReturnValue({ eq: mockEq });
    mockDelete.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ eq: mockEq, select: mockSelect });
  });

  it('should return accounts for GET requests', async () => {
    req = { method: 'GET', query: {} };
    const mockData = [{ id: '123', name: 'Test Account', user_id }];
    mockEq.mockResolvedValueOnce({ data: mockData, error: null });

    await accountsHandler(req as any, res as any, user_id, token);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockData);
  });

  it('should create a new account for POST requests', async () => {
    req = { method: 'POST', body: { name: 'New Account', type: 'asset' } };
    const mockData = { id: 'new-id', name: 'New Account', type: 'asset', user_id };
    mockInsert.mockReturnValue({ select: vi.fn().mockResolvedValueOnce({ data: [mockData], error: null }) });

    await accountsHandler(req as any, res as any, user_id, token);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockData);
  });

  it('should update an existing account for PUT requests', async () => {
    req = { method: 'PUT', query: { id: '123' }, body: { name: 'Updated Account' } };
    const mockData = { id: '123', name: 'Updated Account', user_id };
    mockSelect.mockResolvedValueOnce({ data: [mockData], error: null });

    await accountsHandler(req as any, res as any, user_id, token);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockData);
  });

  it('should delete an account for DELETE requests', async () => {
    req = { method: 'DELETE', query: { id: '123' } };
    mockEq.mockReturnValue({ eq: vi.fn().mockResolvedValue({ count: 1, error: null }) });

    await accountsHandler(req as any, res as any, user_id, token);

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalledWith('');
  });

  it('should return 404 if account not found for PUT', async () => {
    req = { method: 'PUT', query: { id: '123' }, body: { name: 'Updated Account' } };
    mockSelect.mockResolvedValueOnce({ data: [], error: null }); // Simulate not found

    await accountsHandler(req as any, res as any, user_id, token);

    expect(handleErrorResponse).toHaveBeenCalledWith(res, 404, 'Conta não encontrada ou você não tem permissão para atualizar esta conta.');
  });

  it('should return 404 if account not found for DELETE', async () => {
    req = { method: 'DELETE', query: { id: '123' } };
    mockEq.mockReturnValue({ eq: vi.fn().mockResolvedValue({ count: 0, error: null }) }); // Simulate not found

    await accountsHandler(req as any, res as any, user_id, token);

    expect(handleErrorResponse).toHaveBeenCalledWith(res, 404, 'Conta não encontrada ou você não tem permissão para deletar esta conta.');
  });

  it('should return 405 for unsupported methods', async () => {
    req = { method: 'PATCH' };
    await accountsHandler(req as any, res as any, user_id, token);

    expect(res.setHeader).toHaveBeenCalledWith('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    expect(handleErrorResponse).toHaveBeenCalledWith(res, 405, 'Method PATCH Not Allowed');
  });

  it('should handle unexpected errors', async () => {
    req = { method: 'GET', query: {} };
    const dbError = new Error('Unexpected DB error');
    mockEq.mockRejectedValueOnce(dbError);

    await accountsHandler(req as any, res as any, user_id, token);

    expect(handleErrorResponse).toHaveBeenCalledWith(res, 500, 'Unexpected DB error');
  });
});

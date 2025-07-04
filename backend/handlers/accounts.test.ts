import { describe, it, expect, vi } from 'vitest';
import accountsHandler from './accounts';
import { getSupabaseClient, handleErrorResponse } from '../utils/supabaseClient';
;

// Mock das dependências
vi.mock('../utils/supabaseClient', () => {
  const mockSelectEq: { data: { id: string; name: string; user_id: string; }[] | null; error: Error | null; } = { data: [{ id: '123', name: 'Test Account', user_id: 'test-user-id' }], error: null };
  const mockInsertSelect: { data: { id: string; name: string; type: string; user_id: string; }[] | null; error: Error | null; } = { data: [{ id: 'new-id', name: 'New Account', type: 'asset', user_id: 'test-user-id' }], error: null };
  const mockUpdateSelect: { data: { id: string; name: string; user_id: string; }[] | null; error: Error | null; } = { data: [{ id: '123', name: 'Updated Account', user_id: 'test-user-id' }], error: null };
  const mockDeleteResult: { count: number | null; error: Error | null; } = { count: 1, error: null };

  const mockFrom = vi.fn(() => ({
    select: vi.fn(() => ({ eq: vi.fn(() => mockSelectEq) })),
    insert: vi.fn(() => ({ select: vi.fn(() => mockInsertSelect) })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => mockUpdateSelect),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => mockDeleteResult),
      })),
    })),
  }));

  const mockSupabaseClient = {
    from: mockFrom,
  };

  return {
    getSupabaseClient: vi.fn(() => mockSupabaseClient),
    handleErrorResponse: vi.fn((res, status, message) => {
      res.status(status);
      res.json({ error: message });
    }),
    // Export individual mocks for specific test case overrides
    mockSelectEq,
    mockInsertSelect,
    mockUpdateSelect,
    mockDeleteResult,
  };
});

vi.mock('../utils/schemas', () => ({
  createAccountSchema: {
    safeParse: vi.fn((data) => {
      if (data.name && data.type) {
        return { success: true, data: data };
      }
      return { success: false, error: { errors: [{ message: 'Invalid data' }] } };
    }),
  },
  updateAccountSchema: {
    safeParse: vi.fn((data) => {
      if (data.name || data.type) {
        return { success: true, data: data };
      }
      return { success: false, error: { errors: [{ message: 'Invalid data' }] } };
    }),
  },
  uuidSchema: {
    safeParse: vi.fn((id) => {
      if (id === '123' || id === 'new-id') {
        return { success: true, data: id };
      }
      return { success: false, error: { errors: [{ message: 'Invalid UUID' }] } };
    }),
  },
}));

describe('accountsHandler', () => {
  it('should return accounts for GET requests', async () => {
    const req: MockRequest = { method: 'GET', query: {} };
    const res: MockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const user_id = 'test-user-id';
    const token = 'test-token';

    // Mock para simular que a conta foi encontrada
    mockSelectEq.data = [{ id: '123', name: 'Test Account', user_id: 'test-user-id' }];
    mockSelectEq.error = null;

    await accountsHandler(req, res, user_id, token);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([{ id: '123', name: 'Test Account', user_id: 'test-user-id' }]);
  });

  it('should create a new account for POST requests', async () => {
    const req: any = { method: 'POST', body: { name: 'New Account', type: 'asset' } };
    const res: MockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const user_id = 'test-user-id';
    const token = 'test-token';

    vi.mocked(getSupabaseClient('dummy-token').from('accounts').insert().select).mockResolvedValueOnce({ data: [{ id: 'new-id', name: 'New Account', type: 'asset', user_id: 'test-user-id' }], error: null });

    await accountsHandler(req, res, user_id, token);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith([{ id: 'new-id', name: 'New Account', type: 'asset', user_id: 'test-user-id' }]);
  });

  it('should update an existing account for PUT requests', async () => {
    const req: MockRequest = { method: 'PUT', query: { id: '123' }, body: { name: 'Updated Account' } };
    const res: MockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const user_id = 'test-user-id';
    const token = 'test-token';

    vi.mocked(getSupabaseClient('dummy-token').from('accounts').update().eq().eq().select).mockResolvedValueOnce({ data: [{ id: '123', name: 'Updated Account', user_id: 'test-user-id' }], error: null });

    await accountsHandler(req, res, user_id, token);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([{ id: '123', name: 'Updated Account', user_id: 'test-user-id' }]);
  });

  it('should delete an account for DELETE requests', async () => {
    const req: any = { method: 'DELETE', query: { id: '123' } };
    const res: MockResponse = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    };
    const user_id = 'test-user-id';
    const token = 'test-token';

    vi.mocked(getSupabaseClient('dummy-token').from('accounts').delete().eq().eq()).mockResolvedValueOnce({ count: 1, error: null });

    await accountsHandler(req, res, user_id, token);

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalledWith('');
  });

  it('should return 400 for invalid POST body', async () => {
    const req: any = { method: 'POST', body: { name: '' } }; // Invalid name
    const res: MockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const user_id = 'test-user-id';
    const token = 'test-token';

    await accountsHandler(req, res, user_id, token);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(handleErrorResponse).toHaveBeenCalledWith(res, 400, expect.any(String));
  });

  it('should return 400 for invalid PUT body', async () => {
    const req: any = { method: 'PUT', query: { id: '123' }, body: { name: '' } }; // Invalid name
    const res: MockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const user_id = 'test-user-id';
    const token = 'test-token';

    await accountsHandler(req, res, user_id, token);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(handleErrorResponse).toHaveBeenCalledWith(res, 400, expect.any(String));
  });

  it('should return 400 for invalid DELETE id', async () => {
    const req: any = { method: 'DELETE', query: { id: 'invalid-uuid' } };
    const res: MockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const user_id = 'test-user-id';
    const token = 'test-token';

    await accountsHandler(req, res, user_id, token);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(handleErrorResponse).toHaveBeenCalledWith(res, 400, expect.any(String));
  });

  it('should return 404 if account not found for PUT', async () => {
    // Mock para simular que nenhuma conta foi encontrada
    vi.mocked(getSupabaseClient('dummy-token').from('accounts').update().eq().eq().select).mockResolvedValueOnce({ data: [], error: null });

    const req: any = { method: 'PUT', query: { id: '123' }, body: { name: 'Updated Account' } };
    const res: MockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const user_id = 'test-user-id';
    const token = 'test-token';

    await accountsHandler(req, res, user_id, token);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(handleErrorResponse).toHaveBeenCalledWith(res, 404, expect.any(String));
  });

  it('should return 404 if account not found for DELETE', async () => {
    // Mock para simular que nenhuma conta foi encontrada
    vi.mocked(getSupabaseClient('dummy-token').from('accounts').delete().eq().eq()).mockResolvedValueOnce({ count: 0, error: null });

    const req: any = { method: 'DELETE', query: { id: '123' } };
    const res: MockResponse = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    };
    const user_id = 'test-user-id';
    const token = 'test-token';

    await accountsHandler(req, res, user_id, token);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(handleErrorResponse).toHaveBeenCalledWith(res, 404, expect.any(String));
  });

  it('should return 405 for unsupported methods', async () => {
    const req: MockRequest = { method: 'PATCH' };
    const res: MockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      setHeader: vi.fn(),
    };
    const user_id = 'test-user-id';
    const token = 'test-token';

    await accountsHandler(req, res, user_id, token);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.setHeader).toHaveBeenCalledWith('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    expect(handleErrorResponse).toHaveBeenCalledWith(res, 405, expect.any(String));
  });

  it('should handle unexpected errors', async () => {
    // Simula um erro inesperado no Supabase
    vi.mocked(getSupabaseClient('dummy-token').from('accounts').select).mockImplementationOnce(() => {
      throw new Error('Unexpected DB error');
    });

    const req: MockRequest = { method: 'GET', query: {} };
    const res: MockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const user_id = 'test-user-id';
    const token = 'test-token';

    await accountsHandler(req, res, user_id, token);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(handleErrorResponse).toHaveBeenCalledWith(res, 500, expect.any(String));
  });
});
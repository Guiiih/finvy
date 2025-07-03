import { describe, it, expect, vi } from 'vitest';
import accountsHandler from './accounts';
import { getSupabaseClient, handleErrorResponse } from '../utils/supabaseClient';

// Mock das dependências
vi.mock('../utils/supabaseClient', () => ({
  getSupabaseClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: [{ id: '123', name: 'Test Account', user_id: 'test-user-id' }],
          error: null,
        })),
      })),
    })),
  })),
  handleErrorResponse: vi.fn((res, status, message) => res.status(status).json({ error: message })),
}));

describe('accountsHandler', () => {
  it('should return accounts for GET requests', async () => {
    const req: any = { method: 'GET', query: {} };
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const user_id = 'test-user-id';
    const token = 'test-token';

    await accountsHandler(req, res, user_id, token);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([{ id: '123', name: 'Test Account', user_id: 'test-user-id' }]);
  });

  // Adicione mais testes para POST, PUT, DELETE e casos de erro
});

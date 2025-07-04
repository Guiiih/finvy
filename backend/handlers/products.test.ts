import { describe, it, expect, vi } from 'vitest';
import productsHandler from './products';
import { getSupabaseClient, handleErrorResponse, supabase as serviceRoleSupabase } from '../utils/supabaseClient';

// Mock das dependências
vi.mock('../utils/supabaseClient', () => ({
  getSupabaseClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          data: [{ id: 'prod1', name: 'Product 1', user_id: 'test-user-id' }],
          error: null,
        })),
      })),
    })),
  })),
  handleErrorResponse: vi.fn((res, status, message) => res.status(status).json({ error: message })),
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          data: [{ id: 'prod1', name: 'Product 1', user_id: 'test-user-id' }],
          error: null,
        })),
      })),
    })),
  },
}));

describe('productsHandler', () => {
  it('should return products for GET requests', async () => {
    const req: any = { method: 'GET', query: {} };
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const user_id = 'test-user-id';
    const token = 'test-token';

    await productsHandler(req, res, user_id, token);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([{ id: 'prod1', name: 'Product 1', user_id: 'test-user-id' }]);
  });

  // Adicione mais testes para POST, PUT, DELETE e casos de erro
});

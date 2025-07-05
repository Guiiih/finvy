import { describe, it, expect, vi, beforeEach } from 'vitest';
import productsHandler from './products';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { getSupabaseClient, handleErrorResponse, supabase } from '../utils/supabaseClient';
import type { VercelRequest, VercelResponse } from "@vercel/node";

interface MockRequest extends Partial<VercelRequest> {
  method: string;
  query?: Record<string, unknown>;
  body?: unknown;
}

interface MockResponse extends Partial<VercelResponse> {
  status: vi.Mock;
  json: vi.Mock;
  send?: vi.Mock;
  setHeader?: vi.Mock;
  end?: vi.Mock;
}

// Mock functions for Supabase client
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();

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
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
    })),
  },
}));

vi.mock('../utils/schemas', () => ({
  createProductSchema: {
    safeParse: vi.fn((data: { name: string, unit_cost: number }) => {
      if (data.name && data.unit_cost) {
        return { success: true, data };
      }
      return { success: false, error: { errors: [{ message: 'Invalid data' }] } };
    }),
  },
  updateProductSchema: {
    safeParse: vi.fn((data: { name?: string, unit_cost?: number }) => {
      if (Object.keys(data).length > 0) {
        return { success: true, data };
      }
      return { success: false, error: { errors: [{ message: 'Invalid data' }] } };
    }),
  },
}));

describe('productsHandler', () => {
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
    mockSelect.mockReturnValue({ order: mockOrder, eq: mockEq });
    mockUpdate.mockReturnValue({ eq: mockEq });
    mockDelete.mockReturnValue({ eq: mockEq });
        mockEq.mockReturnValue({ eq: mockEq, select: mockSelect, order: mockOrder });
  });

  it('should return products for GET requests', async () => {
    req = { method: 'GET', query: {} };
    const mockData = [{ id: 'prod1', name: 'Product 1', user_id }];
    mockOrder.mockResolvedValueOnce({ data: mockData, error: null });

    await productsHandler(req, res, user_id, token);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockData);
  });

  it('should create a new product for POST requests', async () => {
    req = { method: 'POST', body: { name: 'New Product', unit_cost: 10 } };
    const mockData = { id: 'new-prod', name: 'New Product', unit_cost: 10, user_id };
    mockInsert.mockReturnValue({ select: vi.fn().mockResolvedValueOnce({ data: [mockData], error: null }) });

    await productsHandler(req, res, user_id, token);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockData);
  });

  it('should update an existing product for PUT requests', async () => {
    req = { method: 'PUT', query: { id: 'prod1' }, body: { name: 'Updated Product' } };
    const mockData = { id: 'prod1', name: 'Updated Product', user_id };
    mockSelect.mockResolvedValueOnce({ data: [mockData], error: null });

    await productsHandler(req, res, user_id, token);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockData);
  });

  it('should delete a product for DELETE requests', async () => {
    req = { method: 'DELETE', query: { id: 'prod1' } };
    mockEq.mockReturnValue({ eq: vi.fn().mockResolvedValue({ count: 1, error: null }) });

    await productsHandler(req, res, user_id, token);

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.end).toHaveBeenCalled();
  });

  it('should return 404 if product not found for PUT', async () => {
    req = { method: 'PUT', query: { id: 'prod1' }, body: { name: 'Updated Product' } };
    mockSelect.mockResolvedValueOnce({ data: [], error: null }); // Simulate not found

    await productsHandler(req, res, user_id, token);

    expect(handleErrorResponse).toHaveBeenCalledWith(res, 404, 'Produto não encontrado ou você não tem permissão para atualizar.');
  });

  it('should return 404 if product not found for DELETE', async () => {
    req = { method: 'DELETE', query: { id: 'prod1' } };
    mockEq.mockReturnValue({ eq: vi.fn().mockResolvedValue({ count: 0, error: null }) }); // Simulate not found

    await productsHandler(req, res, user_id, token);

    expect(handleErrorResponse).toHaveBeenCalledWith(res, 404, 'Produto não encontrado ou você não tem permissão para deletar.');
  });

  it('should return 400 for invalid POST body', async () => {
    req = { method: 'POST', body: { name: '' } }; // Invalid body
    await productsHandler(req, res, user_id, token);

    expect(handleErrorResponse).toHaveBeenCalledWith(res, 400, expect.any(String));
  });

  it('should handle unexpected errors', async () => {
    req = { method: 'GET', query: {} };
    const dbError = new Error('Unexpected DB error');
    mockOrder.mockRejectedValueOnce(dbError);

    await productsHandler(req, res, user_id, token);

    expect(handleErrorResponse).toHaveBeenCalledWith(res, 500, 'Erro inesperado na API de produtos.');
  });
});
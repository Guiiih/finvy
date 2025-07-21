
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateProductStockAndCost } from '../services/productService';
import { getSupabaseClient } from '../utils/supabaseClient';
import logger from '../utils/logger';

// Mock do supabaseClient
vi.mock('../utils/supabaseClient', () => ({
  getSupabaseClient: vi.fn(),
}));

// Mock do logger para evitar saída de console durante os testes
vi.mock('../utils/logger', () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('productService', () => {
  const mockRpc = vi.fn();
  const mockSupabaseClient = {
    rpc: mockRpc,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (getSupabaseClient as vi.Mock).mockReturnValue(mockSupabaseClient);
  });

  it('should update product stock and cost successfully via RPC', async () => {
    const mockProduct = { id: 'prod1', name: 'Test Product', stock: 10, cost: 100 };
    mockRpc.mockResolvedValueOnce({ data: mockProduct, error: null });

    const result = await updateProductStockAndCost(
      'prod1',
      5,
      50,
      'purchase',
      'org1',
      'period1',
      'token1'
    );

    expect(getSupabaseClient).toHaveBeenCalledWith('token1');
    expect(mockRpc).toHaveBeenCalledWith('update_product_stock_and_cost', {
      p_product_id: 'prod1',
      p_quantity: 5,
      p_transaction_unit_cost: 50,
      p_transaction_type: 'purchase',
      p_organization_id: 'org1',
      p_accounting_period_id: 'period1',
    });
    expect(result).toEqual(mockProduct);
    expect(logger.info).toHaveBeenCalledWith(
      `Product (ID: prod1) stock and cost updated via RPC.`
    );
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('should throw an error if RPC call fails', async () => {
    const mockError = { message: 'RPC failed', code: '400' };
    mockRpc.mockResolvedValueOnce({ data: null, error: mockError });

    await expect(
      updateProductStockAndCost(
        'prod1',
        5,
        50,
        'purchase',
        'org1',
        'period1',
        'token1'
      )
    ).rejects.toThrow(`Error updating product stock and cost: ${mockError.message}`);

    expect(getSupabaseClient).toHaveBeenCalledWith('token1');
    expect(mockRpc).toHaveBeenCalledWith('update_product_stock_and_cost', {
      p_product_id: 'prod1',
      p_quantity: 5,
      p_transaction_unit_cost: 50,
      p_transaction_type: 'purchase',
      p_organization_id: 'org1',
      p_accounting_period_id: 'period1',
    });
    expect(logger.error).toHaveBeenCalledWith(
      `Error calling RPC update_product_stock_and_cost for product_id: prod1`,
      mockError
    );
    expect(logger.info).not.toHaveBeenCalled();
  });

  it('should handle unexpected errors during RPC call', async () => {
    const unexpectedError = new Error('Network error');
    mockRpc.mockImplementationOnce(() => {
      throw unexpectedError;
    });

    await expect(
      updateProductStockAndCost(
        'prod1',
        5,
        50,
        'purchase',
        'org1',
        'period1',
        'token1'
      )
    ).rejects.toThrow('Network error');

    expect(logger.error).toHaveBeenCalledWith(
      'Error in updateProductStockAndCost:',
      unexpectedError
    );
  });
});

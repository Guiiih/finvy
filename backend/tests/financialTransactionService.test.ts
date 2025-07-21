
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getFinancialTransactions, createFinancialTransaction } from '../services/financialTransactionService';
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

describe('FinancialTransactionService', () => {
  const mockSelect = vi.fn();
  const mockEq = vi.fn();
  const mockOrder = vi.fn();
  const mockInsert = vi.fn();
  const mockSingle = vi.fn();

  const mockFrom = vi.fn(() => ({
    select: mockSelect,
    insert: mockInsert,
  }));

  const mockSupabaseClient = {
    from: mockFrom,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (getSupabaseClient as vi.Mock).mockReturnValue(mockSupabaseClient);

    // Chainable mocks for select and eq
    mockSelect.mockImplementation(() => ({
      eq: mockEq,
      single: mockSingle, // For insert().select().single()
    }));
    mockEq.mockImplementation(() => ({
      eq: mockEq, // Allow chaining multiple eq calls
      order: mockOrder,
    }));
    mockOrder.mockResolvedValue({ data: [], error: null }); // Default mock for get

    // Chainable mocks for insert
    mockInsert.mockImplementation(() => ({
      select: mockSelect,
    }));
    mockSingle.mockResolvedValue({ data: null, error: null }); // Default mock for create
  });

  // Testes para getFinancialTransactions
  it('should fetch accounts payable correctly', async () => {
    const mockData = [{ id: '1', description: 'Rent', amount: 1000 }];
    mockOrder.mockResolvedValueOnce({ data: mockData, error: null });

    const result = await getFinancialTransactions(
      'payable',
      'user1',
      'org1',
      'period1',
      'token1'
    );

    expect(getSupabaseClient).toHaveBeenCalledWith('token1');
    expect(mockFrom).toHaveBeenCalledWith('accounts_payable');
    expect(mockSelect).toHaveBeenCalledWith(
      'id, description, amount, due_date, paid_date, is_paid, received_date, is_received, organization_id, accounting_period_id'
    );
    expect(mockEq).toHaveBeenCalledWith('organization_id', 'org1');
    expect(mockEq).toHaveBeenCalledWith('accounting_period_id', 'period1');
    expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(result).toEqual(mockData);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('should fetch accounts receivable correctly', async () => {
    const mockData = [{ id: '2', description: 'Service', amount: 500 }];
    mockOrder.mockResolvedValueOnce({ data: mockData, error: null });

    const result = await getFinancialTransactions(
      'receivable',
      'user1',
      'org1',
      'period1',
      'token1'
    );

    expect(getSupabaseClient).toHaveBeenCalledWith('token1');
    expect(mockFrom).toHaveBeenCalledWith('accounts_receivable');
    expect(result).toEqual(mockData);
  });

  it('should throw an error when fetching financial transactions fails', async () => {
    const mockError = new Error('DB Error'); // Use Error instance
    mockOrder.mockResolvedValueOnce({ data: null, error: mockError });

    await expect(
      getFinancialTransactions(
        'payable',
        'user1',
        'org1',
        'period1',
        'token1'
      )
    ).rejects.toThrow(mockError); // Expect Error instance

    expect(logger.error).toHaveBeenCalledWith(
      'Financial Transactions Service: Erro ao buscar transações financeiras:',
      mockError
    );
  });

  // Testes para createFinancialTransaction
  it('should create an accounts payable transaction correctly', async () => {
    const newTransaction = { description: 'New Bill', amount: 200, due_date: '2025-07-30' };
    const mockCreatedTransaction = { ...newTransaction, id: '3', user_id: 'user1', organization_id: 'org1', accounting_period_id: 'period1' };
    mockSingle.mockResolvedValueOnce({ data: mockCreatedTransaction, error: null });

    const result = await createFinancialTransaction(
      'payable',
      newTransaction,
      'user1',
      'org1',
      'period1',
      'token1'
    );

    expect(getSupabaseClient).toHaveBeenCalledWith('token1');
    expect(mockFrom).toHaveBeenCalledWith('accounts_payable');
    expect(mockInsert).toHaveBeenCalledWith([
      {
        ...newTransaction,
        user_id: 'user1',
        organization_id: 'org1',
        accounting_period_id: 'period1',
      },
    ]);
    expect(mockSelect).toHaveBeenCalled();
    expect(mockSingle).toHaveBeenCalled();
    expect(result).toEqual(mockCreatedTransaction);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('should create an accounts receivable transaction correctly', async () => {
    const newTransaction = { description: 'New Invoice', amount: 300, due_date: '2025-08-15' };
    const mockCreatedTransaction = { ...newTransaction, id: '4', user_id: 'user1', organization_id: 'org1', accounting_period_id: 'period1' };
    mockSingle.mockResolvedValueOnce({ data: mockCreatedTransaction, error: null });

    const result = await createFinancialTransaction(
      'receivable',
      newTransaction,
      'user1',
      'org1',
      'period1',
      'token1'
    );

    expect(getSupabaseClient).toHaveBeenCalledWith('token1');
    expect(mockFrom).toHaveBeenCalledWith('accounts_receivable');
    expect(mockInsert).toHaveBeenCalledWith([
      {
        ...newTransaction,
        user_id: 'user1',
        organization_id: 'org1',
        accounting_period_id: 'period1',
      },
    ]);
    expect(result).toEqual(mockCreatedTransaction);
  });

  it('should throw an error when creating financial transaction fails', async () => {
    const newTransaction = { description: 'Failed Bill', amount: 100, due_date: '2025-07-25' };
    const mockError = new Error('Insert Error'); // Use Error instance
    mockSingle.mockResolvedValueOnce({ data: null, error: mockError });

    await expect(
      createFinancialTransaction(
        'payable',
        newTransaction,
        'user1',
        'org1',
        'period1',
        'token1'
      )
    ).rejects.toThrow(mockError); // Expect Error instance

    expect(logger.error).toHaveBeenCalledWith(
      'Financial Transactions Service: Erro ao criar transação financeira:',
      mockError
    );
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAccounts, createAccount, updateAccount, deleteAccount } from '../services/accountService';


// Mocking a Supabase client with chainable methods
const mockQueryBuilder = {
  select: vi.fn(),
  eq: vi.fn(),
  is: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  order: vi.fn(),
  single: vi.fn(),
  range: vi.fn(), // Add range for pagination
};

const mockSupabaseClient = {
  from: vi.fn(),
  rpc: vi.fn(),
};

vi.mock('../utils/supabaseClient', () => ({
  getSupabaseClient: vi.fn(() => mockSupabaseClient),
}));

describe('Account Service', () => {
  const mockOrgId = 'org-456';
  const mockPeriodId = 'period-789';
  const mockToken = 'mock-token';

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Configure the mock to be chainable by default
    mockQueryBuilder.select.mockReturnThis();
    mockQueryBuilder.eq.mockReturnThis();
    mockQueryBuilder.is.mockReturnThis();
    mockQueryBuilder.insert.mockReturnThis();
    mockQueryBuilder.update.mockReturnThis();
    mockQueryBuilder.delete.mockReturnThis();
    mockQueryBuilder.order.mockReturnThis();
    mockQueryBuilder.range.mockReturnThis(); // Mock range for pagination
    mockQueryBuilder.single.mockReset(); // Reset single mock

    mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

  });

  describe('getAccounts', () => {
    it('should fetch accounts from Supabase with pagination', async () => {
      const mockAccounts = [{ id: '1', name: 'Cash' }];
      // Mover mockResolvedValue para o final da cadeia de chamadas
      mockQueryBuilder.range.mockResolvedValue({ data: mockAccounts, count: 1, error: null });

      const result = await getAccounts(mockOrgId, mockPeriodId, mockToken, 1, 10);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('accounts');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith(
        "id, name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected",
        { count: 'exact' }
      );
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("organization_id", mockOrgId);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("accounting_period_id", mockPeriodId);
      expect(mockQueryBuilder.order).toHaveBeenCalledWith("name", { ascending: true });
      expect(mockQueryBuilder.range).toHaveBeenCalledWith(0, 9);
      expect(result).toEqual({ data: mockAccounts, count: 1 });
    });
  });

  describe('createAccount', () => {
    it('should create a top-level account', async () => {
      const newAccountData = { name: 'New Account' };
      const createdAccount = { ...newAccountData, id: '3', code: '1', type: 'asset' };

      // 1. Mock the call to get top-level accounts. Assume none exist.
      // Chain: from -> select -> is -> eq -> eq -> order
      mockQueryBuilder.order.mockResolvedValueOnce({ data: [], error: null });

      // 2. Mock the insert call, which is followed by a select.
      // Chain: from -> insert -> select
      const mockSelectAfterInsert = vi.fn().mockResolvedValue({ data: [createdAccount], error: null });
      mockQueryBuilder.insert.mockReturnValue({ select: mockSelectAfterInsert });

      const result = await createAccount(newAccountData, mockOrgId, mockPeriodId, mockToken);

      // Verify the insert was called with the correct, generated data
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith(expect.objectContaining({
        name: 'New Account',
        code: '1', // First top-level account
        type: 'asset', // Default type for first top-level
        organization_id: mockOrgId,
        accounting_period_id: mockPeriodId,
      }));

      // Verify the final result
      expect(result).toEqual(createdAccount);
    });

    it('should create a child account', async () => {
      const parentAccount = { id: '1', code: '1', type: 'asset' };
      const newAccountData = { name: 'Child Account', parent_account_id: '1' };
      const createdAccount = { ...newAccountData, id: '4', code: '1.1', type: 'asset' };

      // 1. Mock fetching the parent account
      mockQueryBuilder.single.mockResolvedValueOnce({ data: parentAccount, error: null });

      // 2. Mock fetching existing children (assume none)
      mockQueryBuilder.order.mockResolvedValueOnce({ data: [], error: null });

      // 3. Mock the insert call
      const mockSelectAfterInsert = vi.fn().mockResolvedValue({ data: [createdAccount], error: null });
      mockQueryBuilder.insert.mockReturnValue({ select: mockSelectAfterInsert });

      const result = await createAccount(newAccountData, mockOrgId, mockPeriodId, mockToken);

      expect(mockQueryBuilder.insert).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Child Account',
        code: '1.1',
        type: 'asset',
        parent_account_id: '1',
      }));
      expect(result).toEqual(createdAccount);
    });
  });

  describe('updateAccount', () => {
    it('should update an account', async () => {
      const accountId = '1';
      const updateData = { name: 'Updated Name' };
      const updatedAccount = { id: accountId, ...updateData };
      mockQueryBuilder.update.mockReturnThis();
      mockQueryBuilder.select.mockResolvedValue({ data: [updatedAccount], error: null });

      const result = await updateAccount(accountId, updateData, mockOrgId, mockPeriodId, mockToken);

      expect(mockSupabaseClient.from('accounts').update).toHaveBeenCalledWith(updateData);
      expect(result).toEqual(updatedAccount);
    });

    it('should return null when updating a non-existent account', async () => {
      const accountId = 'non-existent';
      const updateData = { name: 'Updated Name' };
      mockQueryBuilder.select.mockResolvedValue({ data: [], error: null });

      const result = await updateAccount(accountId, updateData, mockOrgId, mockPeriodId, mockToken);

      expect(result).toBeNull();
    });
  });

  describe('deleteAccount', () => {
    // Helper to create a mock chain for select().eq().eq().single()
    const mockSelectSingleChain = (returnValue: any) => {
      const mockEq1 = vi.fn().mockReturnThis();
      const mockEq2 = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue(returnValue);
      const mockSelect = vi.fn(() => ({
        eq: mockEq1.mockImplementation(() => ({
          eq: mockEq2.mockImplementation(() => ({
            single: mockSingle,
          })),
        })),
      }));
      return mockSelect;
    };

    // Helper to create a mock chain for delete().eq().eq()
    const mockDeleteChain = (returnValue: any) => {
      const mockEq1 = vi.fn().mockReturnThis();
      const mockEq2 = vi.fn().mockReturnThis();
      const mockEq3 = vi.fn().mockResolvedValue(returnValue);
      const mockDelete = vi.fn(() => ({
        eq: mockEq1.mockImplementation(() => ({
          eq: mockEq2.mockImplementation(() => ({
            eq: mockEq3,
          })),
        })),
      }));
      return mockDelete;
    };

    it('should delete an account if it is not protected', async () => {
      const accountId = '1';

      // Mock the protection check
      mockSupabaseClient.from.mockReturnValueOnce({
        select: mockSelectSingleChain({ data: { is_protected: false }, error: null }),
      });

      // Mock the delete operation
      mockSupabaseClient.from.mockReturnValueOnce({
        delete: mockDeleteChain({ count: 1, error: null }),
      });

      const result = await deleteAccount(accountId, mockOrgId, mockPeriodId, mockToken);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('accounts');
      expect(result).toBe(true);
    });

    it('should not delete an account if it is protected', async () => {
      const accountId = 'protected-1';

      // Mock the protection check
      mockSupabaseClient.from.mockReturnValueOnce({
        select: mockSelectSingleChain({ data: { is_protected: true }, error: null }),
      });

      await expect(deleteAccount(accountId, mockOrgId, mockPeriodId, mockToken)).rejects.toThrow("Esta conta está protegida e não pode ser deletada.");
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('accounts');
      // Verify delete was not called
      expect(mockQueryBuilder.delete).not.toHaveBeenCalled();
    });

    it('should return false when deleting a non-existent account', async () => {
      const accountId = 'non-existent';

      // Mock the protection check
      mockSupabaseClient.from.mockReturnValueOnce({
        select: mockSelectSingleChain({ data: { is_protected: false }, error: null }),
      });

      // Mock the delete operation
      mockSupabaseClient.from.mockReturnValueOnce({
        delete: mockDeleteChain({ count: 0, error: null }),
      });

      const result = await deleteAccount(accountId, mockOrgId, mockPeriodId, mockToken);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('accounts');
      expect(result).toBe(false);
    });

    it('should throw an error if fetching for protection check fails', async () => {
      const accountId = '1';
      const dbError = new Error('Fetch error');

      // Mock the protection check to throw an error
      mockSupabaseClient.from.mockReturnValueOnce({
        select: mockSelectSingleChain({ data: null, error: dbError }),
      });

      await expect(deleteAccount(accountId, mockOrgId, mockPeriodId, mockToken)).rejects.toThrow(dbError);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('accounts');
    });
  });
});
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAccounts, createAccount, updateAccount, deleteAccount, invalidateAccountsCache, getCachedAccounts, setCachedAccounts } from './accountService';


// Mocking a Supabase client with chainable methods
const mockSupabaseClient = {
  from: vi.fn(),
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  eq: vi.fn(),
  order: vi.fn(),
  rpc: vi.fn(),
};

vi.mock('../utils/supabaseClient', () => ({
  getSupabaseClient: vi.fn(() => mockSupabaseClient),
}));

describe('Account Service', () => {
  const mockUserId = 'user-123';
  const mockOrgId = 'org-456';
  const mockPeriodId = 'period-789';
  const mockToken = 'mock-token';

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Configure the mock to be chainable by default
    mockSupabaseClient.from.mockReturnThis();
    mockSupabaseClient.select.mockReturnThis();
    mockSupabaseClient.insert.mockReturnThis();
    mockSupabaseClient.update.mockReturnThis();
    mockSupabaseClient.delete.mockReturnThis();
    mockSupabaseClient.eq.mockReturnThis();
    mockSupabaseClient.order.mockReturnThis();

    invalidateAccountsCache(mockUserId);
  });

  describe('getAccounts', () => {
    it('should fetch accounts from Supabase when cache is empty', async () => {
      const mockAccounts = [{ id: '1', name: 'Cash' }];
      mockSupabaseClient.order.mockResolvedValue({ data: mockAccounts, error: null });

      const result = await getAccounts(mockUserId, mockOrgId, mockPeriodId, mockToken);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('accounts');
      expect(result).toEqual(mockAccounts);
    });

    it('should return cached accounts if available', async () => {
      const cachedAccounts = [{ id: 'cached-1', name: 'Cached Account' }];
      setCachedAccounts(mockUserId, cachedAccounts as Account[]);

      const result = await getAccounts(mockUserId, mockOrgId, mockPeriodId, mockToken);

      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
      expect(result).toEqual(cachedAccounts);
    });
  });

  describe('createAccount', () => {
    it('should create an account and invalidate cache', async () => {
      const newAccount = { name: 'New Account', type: 'asset' };
      const createdAccount = { ...newAccount, id: '3' };
      mockSupabaseClient.select.mockResolvedValue({ data: [createdAccount], error: null });

      setCachedAccounts(mockUserId, [{ id: 'pre-cache', name: 'Old data' }] as Account[]);

      const result = await createAccount(newAccount as Account, mockUserId, mockOrgId, mockPeriodId, mockToken);
      
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(expect.objectContaining(newAccount));
      expect(result).toEqual(createdAccount);
      expect(getCachedAccounts(mockUserId)).toBeNull();
    });
  });

  describe('updateAccount', () => {
    it('should update an account and invalidate cache', async () => {
      const accountId = '1';
      const updateData = { name: 'Updated Name' };
      const updatedAccount = { id: accountId, ...updateData };
      mockSupabaseClient.select.mockResolvedValue({ data: [updatedAccount], error: null });

      setCachedAccounts(mockUserId, [{ id: accountId, name: 'Original data' }] as Account[]);

      const result = await updateAccount(accountId, updateData, mockUserId, mockOrgId, mockPeriodId, mockToken);

      expect(mockSupabaseClient.update).toHaveBeenCalledWith(updateData);
      expect(result).toEqual(updatedAccount);
      expect(getCachedAccounts(mockUserId)).toBeNull();
    });
  });

  describe('deleteAccount', () => {
    it('should call the delete function with correct parameters', async () => {
      const accountId = '1';
      
      // The service chains multiple .eq() calls. The last one is awaited.
      // We must mock `eq` to return `this` (the client) for all but the last call.
      mockSupabaseClient.eq
        .mockImplementationOnce(() => mockSupabaseClient) // for eq('id', ...)
        .mockImplementationOnce(() => mockSupabaseClient) // for eq('user_id', ...)
        .mockImplementationOnce(() => mockSupabaseClient) // for eq('organization_id', ...)
        .mockResolvedValueOnce({ error: null, count: 1 }); // for the final eq('accounting_period_id', ...)

      const result = await deleteAccount(accountId, mockUserId, mockOrgId, mockPeriodId, mockToken);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('accounts');
      expect(mockSupabaseClient.delete).toHaveBeenCalled();
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', accountId);
      expect(result).toBe(true);
    });
  });
});
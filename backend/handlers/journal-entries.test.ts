import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getJournalEntries, createJournalEntry, updateJournalEntry, deleteJournalEntry, checkDoubleEntryBalance, invalidateJournalEntriesCache, getCachedJournalEntries, setCachedJournalEntries } from '../services/journalEntryService';

// Mocking a Supabase client with chainable methods
const mockSupabaseClient = {
  from: vi.fn(),
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  eq: vi.fn(),
  order: vi.fn(),
  rpc: vi.fn(),
};

vi.mock('../utils/supabaseClient', () => ({
  getSupabaseClient: vi.fn(() => mockSupabaseClient),
}));

describe('Journal Entry Service', () => {
  const mockUserId = 'user-123';
  const mockOrgId = 'org-456';
  const mockPeriodId = 'period-789';
  const mockToken = 'mock-token';

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Configure the mock to be chainable
    mockSupabaseClient.from.mockReturnThis();
    mockSupabaseClient.select.mockReturnThis();
    mockSupabaseClient.insert.mockReturnThis();
    mockSupabaseClient.update.mockReturnThis();
    mockSupabaseClient.eq.mockReturnThis();
    mockSupabaseClient.order.mockReturnThis();

    invalidateJournalEntriesCache(mockUserId);
  });

  describe('getJournalEntries', () => {
    it('should fetch journal entries from Supabase when cache is empty', async () => {
      const mockEntries = [{ id: '1', description: 'Test Entry' }];
      mockSupabaseClient.order.mockResolvedValue({ data: mockEntries, error: null });

      const result = await getJournalEntries(mockUserId, mockOrgId, mockPeriodId, mockToken);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('journal_entries');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith(expect.any(String));
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('user_id', mockUserId);
      expect(result).toEqual(mockEntries);
    });

    it('should return cached journal entries if available', async () => {
      const cachedEntries = [{ id: 'cached-1', description: 'Cached Entry' }];
      setCachedJournalEntries(mockUserId, cachedEntries as JournalEntry[]);

      const result = await getJournalEntries(mockUserId, mockOrgId, mockPeriodId, mockToken);

      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
      expect(result).toEqual(cachedEntries);
    });
  });

  describe('createJournalEntry', () => {
    it('should create a journal entry and invalidate cache', async () => {
      const newEntry = { description: 'New Entry', entry_date: new Date() };
      const createdEntry = { ...newEntry, id: '3' };
      mockSupabaseClient.select.mockResolvedValue({ data: [createdEntry], error: null });

      setCachedJournalEntries(mockUserId, [{ id: 'pre-cache', description: 'Old data' }] as JournalEntry[]);

      const result = await createJournalEntry(newEntry as JournalEntry, mockUserId, mockOrgId, mockPeriodId, mockToken);

      expect(mockSupabaseClient.insert).toHaveBeenCalledWith([expect.objectContaining(newEntry)]);
      expect(result).toEqual(createdEntry);
      expect(getCachedJournalEntries(mockUserId)).toBeNull();
    });
  });

  describe('updateJournalEntry', () => {
    it('should update a journal entry and invalidate cache', async () => {
      const entryId = '1';
      const updateData = { description: 'Updated Description' };
      const updatedEntry = { id: entryId, ...updateData };
      mockSupabaseClient.select.mockResolvedValue({ data: [updatedEntry], error: null });

      setCachedJournalEntries(mockUserId, [{ id: entryId, description: 'Original data' }] as JournalEntry[]);

      const result = await updateJournalEntry(entryId, updateData, mockUserId, mockOrgId, mockPeriodId, mockToken);

      expect(mockSupabaseClient.update).toHaveBeenCalledWith(updateData);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', entryId);
      expect(result).toEqual(updatedEntry);
      expect(getCachedJournalEntries(mockUserId)).toBeNull();
    });
  });

  describe('deleteJournalEntry', () => {
    it('should call the delete RPC function with correct parameters', async () => {
      const entryId = '1';
      mockSupabaseClient.rpc.mockResolvedValue({ data: true, error: null });

      const result = await deleteJournalEntry(entryId, mockUserId, mockOrgId, mockPeriodId, mockToken);

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('delete_journal_entry_and_lines', expect.any(Object));
      expect(result).toBe(true);
    });
  });

  describe('checkDoubleEntryBalance', () => {
    it('should return true for balanced entries', async () => {
      const entryId = 'balanced-entry';
      const lines = [
        { debit: 100, credit: 0 },
        { debit: 50, credit: 0 },
        { debit: 0, credit: 150 },
      ];
      mockSupabaseClient.eq.mockResolvedValue({ data: lines, error: null });

      const isBalanced = await checkDoubleEntryBalance(entryId, mockUserId, mockToken);

      expect(isBalanced).toBe(true);
    });

    it('should return false for unbalanced entries', async () => {
      const entryId = 'unbalanced-entry';
      const lines = [
        { debit: 100, credit: 0 },
        { debit: 0, credit: 150.01 },
      ];
      mockSupabaseClient.eq.mockResolvedValue({ data: lines, error: null });

      const isBalanced = await checkDoubleEntryBalance(entryId, mockUserId, mockToken);

      expect(isBalanced).toBe(false);
    });

    it('should return true for entries with no lines', async () => {
      const entryId = 'no-lines-entry';
      mockSupabaseClient.eq.mockResolvedValue({ data: [], error: null });

      const isBalanced = await checkDoubleEntryBalance(entryId, mockUserId, mockToken);

      expect(isBalanced).toBe(true);
    });
  });
});
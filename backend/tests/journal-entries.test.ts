import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getJournalEntries, createJournalEntry, updateJournalEntry, deleteJournalEntry, checkDoubleEntryBalance } from '../../services/journalEntryService';

// Mocking a Supabase client with chainable methods
const mockSupabaseClient = {
  from: vi.fn(),
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  eq: vi.fn(),
  order: vi.fn(),
  rpc: vi.fn(),
  range: vi.fn(),
  single: vi.fn(), // Adicionar single para o caso de .single() ser usado
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
    mockSupabaseClient.range.mockReturnThis();
    mockSupabaseClient.rpc.mockReturnThis();
    mockSupabaseClient.single.mockReturnThis();
  });

  describe('getJournalEntries', () => {
    it('should fetch journal entries from Supabase with pagination', async () => {
      const mockEntries = [{ id: '1', description: 'Test Entry' }];
      // Mover mockResolvedValue para o final da cadeia de chamadas
      mockSupabaseClient.range.mockResolvedValue({ data: mockEntries, count: 1, error: null });

      const result = await getJournalEntries(mockOrgId, mockPeriodId, mockToken, 1, 10);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('journal_entries');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith(
        "id, entry_date, description, organization_id, accounting_period_id",
        { count: 'exact' }
      );
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('organization_id', mockOrgId);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('accounting_period_id', mockPeriodId);
      expect(mockSupabaseClient.order).toHaveBeenCalledWith("entry_date", { ascending: false });
      expect(mockSupabaseClient.range).toHaveBeenCalledWith(0, 9);
      expect(result).toEqual({ data: mockEntries, count: 1 });
    });
  });

  describe('createJournalEntry', () => {
    it('should create a journal entry', async () => {
      const newEntry = { description: 'New Entry', entry_date: new Date().toISOString() };
      const createdEntry = { ...newEntry, id: '3' };
      mockSupabaseClient.select.mockResolvedValue({ data: [createdEntry], error: null });

      const result = await createJournalEntry(newEntry, mockOrgId, mockPeriodId, mockToken);

      expect(mockSupabaseClient.insert).toHaveBeenCalledWith([expect.objectContaining(newEntry)]);
      expect(result).toEqual(createdEntry);
    });
  });

  describe('updateJournalEntry', () => {
    it('should update a journal entry', async () => {
      const entryId = '1';
      const updateData = { description: 'Updated Description' };
      const updatedEntry = { id: entryId, ...updateData };
      mockSupabaseClient.select.mockResolvedValue({ data: [updatedEntry], error: null });

      const result = await updateJournalEntry(entryId, updateData, mockOrgId, mockPeriodId, mockToken);

      expect(mockSupabaseClient.update).toHaveBeenCalledWith(updateData);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', entryId);
      expect(result).toEqual(updatedEntry);
    });
  });

  describe('deleteJournalEntry', () => {
    it('should call the delete RPC function with correct parameters', async () => {
      const entryId = '1';
      mockSupabaseClient.rpc.mockResolvedValue({ data: true, error: null });

      const result = await deleteJournalEntry(entryId, mockOrgId, mockPeriodId, mockToken, mockUserId);

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('delete_journal_entry_and_lines', expect.objectContaining({
        p_journal_entry_id: entryId,
        p_organization_id: mockOrgId,
        p_accounting_period_id: mockPeriodId,
        p_user_id: mockUserId,
      }));
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

      const isBalanced = await checkDoubleEntryBalance(entryId, mockToken);

      expect(isBalanced).toBe(true);
    });

    it('should return false for unbalanced entries', async () => {
      const entryId = 'unbalanced-entry';
      const lines = [
        { debit: 100, credit: 0 },
        { debit: 0, credit: 150.01 },
      ];
      mockSupabaseClient.eq.mockResolvedValue({ data: lines, error: null });

      const isBalanced = await checkDoubleEntryBalance(entryId, mockToken);

      expect(isBalanced).toBe(false);
    });

    it('should return true for entries with no lines', async () => {
      const entryId = 'no-lines-entry';
      mockSupabaseClient.eq.mockResolvedValue({ data: [], error: null });

      const isBalanced = await checkDoubleEntryBalance(entryId, mockToken);

      expect(isBalanced).toBe(true);
    });
  });
});

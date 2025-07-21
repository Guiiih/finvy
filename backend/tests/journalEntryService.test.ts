
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getJournalEntries,
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
  checkDoubleEntryBalance,
} from '../services/journalEntryService';
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
    warn: vi.fn(),
  },
}));

describe('JournalEntryService', () => {
  const mockSelect = vi.fn();
  const mockEq = vi.fn();
  const mockOrder = vi.fn();
  const mockRange = vi.fn();
  const mockInsert = vi.fn();
  const mockUpdate = vi.fn();
  const mockRpc = vi.fn();
  const mockSingle = vi.fn();

  const mockFrom = vi.fn(() => ({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
  }));

  const mockSupabaseClient = {
    from: mockFrom,
    rpc: mockRpc,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (getSupabaseClient as vi.Mock).mockReturnValue(mockSupabaseClient);

    // Mocks encadeados para select (para getJournalEntries e checkDoubleEntryBalance)
    mockSelect.mockImplementation((query) => {
      if (query === 'id, entry_date, description, organization_id, accounting_period_id') {
        return { eq: mockEq }; // For getJournalEntries
      } else if (query === 'debit, credit') {
        return { eq: mockEq }; // For checkDoubleEntryBalance
      }
      return { eq: mockEq, single: mockSingle }; // Default for update().select().single()
    });

    // Mocks encadeados para eq
    mockEq.mockImplementation(() => ({
      eq: mockEq, // Permite múltiplos .eq()
      order: mockOrder,
      range: mockRange, // For getJournalEntries
      select: mockSelect, // For update().eq().select()
    }));

    mockOrder.mockImplementation(() => ({
      range: mockRange,
    }));
    mockRange.mockResolvedValue({ data: [], error: null, count: 0 }); // Mock padrão para getJournalEntries

    // Mocks encadeados para insert
    mockInsert.mockImplementation(() => ({
      select: mockSelect,
    }));

    // Mocks encadeados para update
    mockUpdate.mockImplementation(() => ({
      eq: mockEq,
    }));

    mockSingle.mockResolvedValue({ data: null, error: null }); // Mock padrão para single()
    mockRpc.mockResolvedValue({ data: null, error: null }); // Mock padrão para rpc()
  });

  // Testes para getJournalEntries
  it('should fetch journal entries with pagination correctly', async () => {
    const mockData = [{ id: '1', description: 'Entry 1' }];
    const mockCount = 10;
    mockRange.mockResolvedValueOnce({ data: mockData, error: null, count: mockCount });

    const result = await getJournalEntries(
      'org1',
      'period1',
      'token1',
      1,
      5
    );

    expect(getSupabaseClient).toHaveBeenCalledWith('token1');
    expect(mockFrom).toHaveBeenCalledWith('journal_entries');
    expect(mockSelect).toHaveBeenCalledWith(
      'id, entry_date, description, organization_id, accounting_period_id',
      { count: 'exact' }
    );
    expect(mockEq).toHaveBeenCalledWith('organization_id', 'org1');
    expect(mockEq).toHaveBeenCalledWith('accounting_period_id', 'period1');
    expect(mockOrder).toHaveBeenCalledWith('entry_date', { ascending: false });
    expect(mockRange).toHaveBeenCalledWith(0, 4); // (page - 1) * limit, (page - 1) * limit + limit - 1
    expect(result).toEqual({ data: mockData, count: mockCount });
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('should throw an error when fetching journal entries fails', async () => {
    const mockError = new Error('DB Error');
    mockRange.mockResolvedValueOnce({ data: null, error: mockError, count: 0 });

    await expect(
      getJournalEntries('org1', 'period1', 'token1', 1, 10)
    ).rejects.toThrow(mockError);

    expect(logger.error).toHaveBeenCalledWith(
      'Journal Entries Service: Erro ao buscar lançamentos de diário:',
      mockError
    );
  });

  // Testes para createJournalEntry
  it('should create a journal entry correctly', async () => {
    const newEntry = { entry_date: '2025-07-20', description: 'New Entry' };
    const mockCreatedEntry = { ...newEntry, id: 'new-id', organization_id: 'org1', accounting_period_id: 'period1' };
    mockSelect.mockResolvedValueOnce({ data: [mockCreatedEntry], error: null });

    const result = await createJournalEntry(
      newEntry,
      'org1',
      'period1',
      'token1'
    );

    expect(getSupabaseClient).toHaveBeenCalledWith('token1');
    expect(mockFrom).toHaveBeenCalledWith('journal_entries');
    expect(mockInsert).toHaveBeenCalledWith([
      {
        ...newEntry,
        organization_id: 'org1',
        accounting_period_id: 'period1',
      },
    ]);
    expect(mockSelect).toHaveBeenCalled();
    expect(result).toEqual(mockCreatedEntry);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('should throw an error when creating journal entry fails', async () => {
    const newEntry = { entry_date: '2025-07-20', description: 'New Entry' };
    const mockError = new Error('Insert Error');
    mockSelect.mockResolvedValueOnce({ data: null, error: mockError });

    await expect(
      createJournalEntry(newEntry, 'org1', 'period1', 'token1')
    ).rejects.toThrow(mockError);

    expect(logger.error).toHaveBeenCalledWith(
      'Journal Entries Service: Erro ao criar lançamento de diário:',
      mockError
    );
  });

  // Testes para updateJournalEntry
  it('should update a journal entry correctly', async () => {
    const updateData = { description: 'Updated Entry' };
    const mockUpdatedEntry = { id: '1', entry_date: '2025-07-20', description: 'Updated Entry' };
    mockSelect.mockResolvedValueOnce({ data: [mockUpdatedEntry], error: null });

    const result = await updateJournalEntry(
      '1',
      updateData,
      'org1',
      'period1',
      'token1'
    );

    expect(getSupabaseClient).toHaveBeenCalledWith('token1');
    expect(mockFrom).toHaveBeenCalledWith('journal_entries');
    expect(mockUpdate).toHaveBeenCalledWith(updateData);
    expect(mockEq).toHaveBeenCalledWith('id', '1');
    expect(mockEq).toHaveBeenCalledWith('organization_id', 'org1');
    expect(mockEq).toHaveBeenCalledWith('accounting_period_id', 'period1');
    expect(mockSelect).toHaveBeenCalled();
    expect(result).toEqual(mockUpdatedEntry);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('should return null if no journal entry is found for update', async () => {
    mockSelect.mockResolvedValueOnce({ data: [], error: null });

    const result = await updateJournalEntry(
      'non-existent-id',
      { description: 'Updated Entry' },
      'org1',
      'period1',
      'token1'
    );

    expect(result).toBeNull();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('should throw an error when updating journal entry fails', async () => {
    const updateData = { description: 'Updated Entry' };
    const mockError = new Error('Update Error');
    mockSelect.mockResolvedValueOnce({ data: null, error: mockError });

    await expect(
      updateJournalEntry('1', updateData, 'org1', 'period1', 'token1')
    ).rejects.toThrow(mockError);

    expect(logger.error).toHaveBeenCalledWith(
      'Journal Entries Service: Erro ao atualizar lançamento de diário:',
      mockError
    );
  });

  // Testes para deleteJournalEntry
  it('should delete a journal entry correctly via RPC', async () => {
    mockRpc.mockResolvedValueOnce({ data: true, error: null });

    const result = await deleteJournalEntry(
      '1',
      'org1',
      'period1',
      'token1',
      'user1'
    );

    expect(getSupabaseClient).toHaveBeenCalledWith('token1');
    expect(mockRpc).toHaveBeenCalledWith('delete_journal_entry_and_lines', {
      p_journal_entry_id: '1',
      p_organization_id: 'org1',
      p_accounting_period_id: 'period1',
      p_user_id: 'user1',
    });
    expect(result).toBe(true);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('should throw an error when deleting journal entry fails', async () => {
    const mockError = new Error('RPC Delete Error');
    mockRpc.mockResolvedValueOnce({ data: null, error: mockError });

    await expect(
      deleteJournalEntry('1', 'org1', 'period1', 'token1', 'user1')
    ).rejects.toThrow(mockError);

    expect(logger.error).toHaveBeenCalledWith(
      `Journal Entries Service: Erro ao deletar lançamento principal 1 via RPC:`,
      mockError
    );
  });

  // Testes para checkDoubleEntryBalance
  it('should return true if journal entry is balanced', async () => {
    const mockEntryLines = [
      { debit: 100, credit: 0 },
      { debit: 0, credit: 100 },
    ];
    mockEq.mockResolvedValueOnce({ data: mockEntryLines, error: null });

    const result = await checkDoubleEntryBalance('entry1', 'token1');

    expect(getSupabaseClient).toHaveBeenCalledWith('token1');
    expect(mockFrom).toHaveBeenCalledWith('entry_lines');
    expect(mockSelect).toHaveBeenCalledWith('debit, credit');
    expect(mockEq).toHaveBeenCalledWith('journal_entry_id', 'entry1');
    expect(result).toBe(true);
    expect(logger.error).not.toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('should return false if journal entry is unbalanced', async () => {
    const mockEntryLines = [
      { debit: 100, credit: 0 },
      { debit: 0, credit: 50 },
    ];
    mockEq.mockResolvedValueOnce({ data: mockEntryLines, error: null });

    const result = await checkDoubleEntryBalance('entry1', 'token1');

    expect(result).toBe(false);
    expect(logger.warn).toHaveBeenCalledWith(
      `Journal entry entry1 is unbalanced. Debits: 100, Credits: 50`
    );
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('should return true if no entry lines are found (considered balanced)', async () => {
    mockEq.mockResolvedValueOnce({ data: [], error: null });

    const result = await checkDoubleEntryBalance('entry1', 'token1');

    expect(result).toBe(true);
    expect(logger.warn).toHaveBeenCalledWith(
      `No entry lines found for journal entry entry1.`
    );
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('should return false if fetching entry lines fails', async () => {
    const mockError = new Error('Fetch Error');
    mockEq.mockResolvedValueOnce({ data: null, error: mockError });

    const result = await checkDoubleEntryBalance('entry1', 'token1');

    expect(result).toBe(false);
    expect(logger.error).toHaveBeenCalledWith(
      `Error fetching entry lines for journal entry entry1:`,
      mockError
    );
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('should return false if an unexpected error occurs in checkDoubleEntryBalance', async () => {
    const unexpectedError = new Error('Unexpected Error');
    mockFrom.mockImplementationOnce(() => {
      throw unexpectedError;
    });

    const result = await checkDoubleEntryBalance('entry1', 'token1');

    expect(result).toBe(false);
    expect(logger.error).toHaveBeenCalledWith(
      `Unexpected error in checkDoubleEntryBalance for journal entry entry1:`,
      unexpectedError
    );
  });
});

/// <reference types="vitest/globals" />
// @ts-expect-error Vite/Vitest types are not available in the test environment.
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import {
  createJournalEntry,
  getJournalEntries,
  updateJournalEntry,
  deleteJournalEntry,
  bulkDeleteJournalEntries,
  bulkUpdateJournalEntryStatus,
  checkDoubleEntryBalance,
} from '../services/journalEntryService';
import { getSupabaseClient } from '../utils/supabaseClient';
import logger from '../utils/logger';

// Mock the Supabase client
vi.mock('../utils/supabaseClient', () => ({
  getSupabaseClient: vi.fn(),
}));

// Mock the logger
vi.mock('../utils/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('journalEntryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const commonArgs = {
    organization_id: 'org123',
    active_accounting_period_id: 'period123',
    token: 'test-token',
    user_id: 'user123',
  };

  describe('createJournalEntry', () => {
    it('should create a new journal entry successfully', async () => {
      const newEntry = {
        entry_date: '2025-01-01',
        description: 'Test Entry',
        reference: 'REF001',
        status: 'draft',
        created_by_name: 'Test User',
        created_by_email: 'test@example.com',
        created_by_username: 'testuser',
      };
      const expectedCreatedEntry = { id: 'uuid-123', ...newEntry, ...commonArgs };

      (getSupabaseClient as vi.Mock).mockReturnValue({
        from: vi.fn(() => ({
          insert: vi.fn(() => ({
            select: vi.fn().mockResolvedValueOnce({ data: [expectedCreatedEntry], error: null }),
          })),
        })),
      });

      const result = await createJournalEntry(
        newEntry,
        commonArgs.organization_id,
        commonArgs.active_accounting_period_id,
        commonArgs.token,
      );

      expect(getSupabaseClient).toHaveBeenCalledWith(commonArgs.token);
      expect(result).toEqual(expectedCreatedEntry);
    });

    it('should throw an error if Supabase insertion fails', async () => {
      const newEntry = {
        entry_date: '2025-01-01',
        description: 'Test Entry',
        reference: 'REF001',
        status: 'draft',
        created_by_name: 'Test User',
        created_by_email: 'test@example.com',
        created_by_username: 'testuser',
      };
      const mockError = new Error('DB Error');

      (getSupabaseClient as vi.Mock).mockReturnValue({
        from: vi.fn(() => ({
          insert: vi.fn(() => ({
            select: vi.fn().mockResolvedValueOnce({ data: null, error: mockError }),
          })),
        })),
      });

      await expect(
        createJournalEntry(
          newEntry,
          commonArgs.organization_id,
          commonArgs.active_accounting_period_id,
          commonArgs.token,
        ),
      ).rejects.toThrow(mockError);
      expect(logger.error).toHaveBeenCalledWith({ dbError: mockError }, 'Journal Entries Service: Erro ao criar lançamento de diário:');
    });
  });

  describe('getJournalEntries', () => {
    interface MockQuery {
      from: Mock;
      select: Mock;
      eq: Mock;
      order: Mock;
      range: Mock;
      gte: Mock;
      lte: Mock;
      in: Mock;
    }
    const createMockQuery = (resolvedValue: unknown) => {
      const mockQuery: MockQuery = {} as MockQuery;
      mockQuery.from = vi.fn(() => mockQuery);
      mockQuery.select = vi.fn(() => mockQuery);
      mockQuery.eq = vi.fn(() => mockQuery);
      mockQuery.order = vi.fn(() => mockQuery);
      mockQuery.range = vi.fn().mockResolvedValueOnce(resolvedValue);
      mockQuery.gte = vi.fn(() => mockQuery);
      mockQuery.lte = vi.fn(() => mockQuery);
      mockQuery.in = vi.fn(() => mockQuery);
      return mockQuery;
    };

    it('should retrieve journal entries successfully', async () => {
      const mockEntries = [{ id: 'entry1', description: 'Entry 1' }];

      (getSupabaseClient as vi.Mock).mockReturnValue(createMockQuery({ data: mockEntries, count: 1, error: null }));

      const result = await getJournalEntries(
        commonArgs.organization_id,
        commonArgs.active_accounting_period_id,
        commonArgs.token,
        1,
        10,
      );

      expect(getSupabaseClient).toHaveBeenCalledWith(commonArgs.token);
      expect(result).toEqual({ data: mockEntries, count: 1 });
    });

    it('should apply status filter if provided', async () => {
      const mockEntries = [{ id: 'entry1', description: 'Entry 1', status: 'posted' }];

      (getSupabaseClient as vi.Mock).mockReturnValue(createMockQuery({ data: mockEntries, count: 1, error: null }));

      await getJournalEntries(
        commonArgs.organization_id,
        commonArgs.active_accounting_period_id,
        commonArgs.token,
        1,
        10,
        'posted',
      );

      expect(getSupabaseClient).toHaveBeenCalledWith(commonArgs.token);
    });

    it('should apply date filters if provided', async () => {
      const mockEntries = [{ id: 'entry1', description: 'Entry 1', entry_date: '2025-01-15' }];

      (getSupabaseClient as vi.Mock).mockReturnValue(createMockQuery({ data: mockEntries, count: 1, error: null }));

      await getJournalEntries(
        commonArgs.organization_id,
        commonArgs.active_accounting_period_id,
        commonArgs.token,
        1,
        10,
        null,
        { dateFrom: '2025-01-01', dateTo: '2025-01-31' },
      );

      expect(getSupabaseClient).toHaveBeenCalledWith(commonArgs.token);
    });

    it('should throw an error if Supabase query fails', async () => {
      const mockError = new Error('DB Error');

      (getSupabaseClient as vi.Mock).mockReturnValue(createMockQuery({ data: null, count: 0, error: mockError }));

      await expect(
        getJournalEntries(
          commonArgs.organization_id,
          commonArgs.active_accounting_period_id,
          commonArgs.token,
        ),
      ).rejects.toThrow(mockError);
      expect(logger.error).toHaveBeenCalledWith({ dbError: mockError }, 'Journal Entries Service: Erro ao buscar lançamentos de diário:');
    });
  });

  describe('updateJournalEntry', () => {
    interface MockUpdateQuery {
      from: Mock;
      update: Mock;
      eq: Mock;
      select: Mock;
    }
    const createMockUpdateQuery = (resolvedValue: unknown) => {
      const mockQuery: MockUpdateQuery = {} as MockUpdateQuery;
      mockQuery.from = vi.fn(() => mockQuery);
      mockQuery.update = vi.fn(() => mockQuery);
      mockQuery.eq = vi.fn(() => mockQuery);
      mockQuery.select = vi.fn().mockResolvedValueOnce(resolvedValue);
      return mockQuery;
    };

    it('should update a journal entry successfully', async () => {
      const updateData = { description: 'Updated Description' };
      const expectedUpdatedEntry = { id: 'uuid-123', description: 'Updated Description', ...commonArgs };

      (getSupabaseClient as vi.Mock).mockReturnValue(createMockUpdateQuery({ data: [expectedUpdatedEntry], error: null }));

      const result = await updateJournalEntry(
        'uuid-123',
        updateData,
        commonArgs.organization_id,
        commonArgs.active_accounting_period_id,
        commonArgs.token,
      );

      expect(getSupabaseClient).toHaveBeenCalledWith(commonArgs.token);
      expect(result).toEqual(expectedUpdatedEntry);
    });

    it('should return null if no entry is found for update', async () => {
      (getSupabaseClient as vi.Mock).mockReturnValue(createMockUpdateQuery({ data: [], error: null }));

      const result = await updateJournalEntry(
        'non-existent-id',
        { description: 'Updated' },
        commonArgs.organization_id,
        commonArgs.active_accounting_period_id,
        commonArgs.token,
      );

      expect(result).toBeNull();
    });

    it('should throw an error if Supabase update fails', async () => {
      const mockError = new Error('Update Error');

      (getSupabaseClient as vi.Mock).mockReturnValue(createMockUpdateQuery({ data: null, error: mockError }));

      await expect(
        updateJournalEntry(
          'uuid-123',
          { description: 'Updated' },
          commonArgs.organization_id,
          commonArgs.active_accounting_period_id,
          commonArgs.token,
        ),
      ).rejects.toThrow(mockError);
      expect(logger.error).toHaveBeenCalledWith({ dbError: mockError }, 'Journal Entries Service: Erro ao atualizar lançamento de diário:');
    });
  });

  describe('deleteJournalEntry', () => {
    it('should delete a journal entry successfully via RPC', async () => {
      (getSupabaseClient as vi.Mock).mockReturnValue({
        rpc: vi.fn().mockResolvedValueOnce({ data: true, error: null }),
      });

      const result = await deleteJournalEntry(
        'uuid-123',
        commonArgs.organization_id,
        commonArgs.active_accounting_period_id,
        commonArgs.token,
        commonArgs.user_id,
      );

      expect(getSupabaseClient).toHaveBeenCalledWith(commonArgs.token);
      expect(result).toBe(true);
    });

    it('should throw an error if RPC deletion fails', async () => {
      const mockError = new Error('RPC Delete Error');

      (getSupabaseClient as vi.Mock).mockReturnValue({
        rpc: vi.fn().mockResolvedValueOnce({ data: null, error: mockError }),
      });

      await expect(
        deleteJournalEntry(
          'uuid-123',
          commonArgs.organization_id,
          commonArgs.active_accounting_period_id,
          commonArgs.token,
          commonArgs.user_id,
        ),
      ).rejects.toThrow(mockError);
      expect(logger.error).toHaveBeenCalledWith({ dbError: mockError }, 'Journal Entries Service: Erro ao deletar lançamento principal uuid-123 via RPC:');
    });
  });

  describe('bulkDeleteJournalEntries', () => {
    it('should bulk delete journal entries successfully via RPC', async () => {
      const idsToDelete = ['id1', 'id2'];

      (getSupabaseClient as vi.Mock).mockReturnValue({
        rpc: vi.fn().mockResolvedValueOnce({ data: true, error: null }),
      });

      const result = await bulkDeleteJournalEntries(
        idsToDelete,
        commonArgs.organization_id,
        commonArgs.active_accounting_period_id,
        commonArgs.token,
        commonArgs.user_id,
      );

      expect(getSupabaseClient).toHaveBeenCalledWith(commonArgs.token);
      expect(result).toBe(true);
    });

    it('should throw an error if bulk RPC deletion fails', async () => {
      const idsToDelete = ['id1', 'id2'];
      const mockError = new Error('Bulk RPC Delete Error');

      (getSupabaseClient as vi.Mock).mockReturnValue({
        rpc: vi.fn().mockResolvedValueOnce({ data: null, error: mockError }),
      });

      await expect(
        bulkDeleteJournalEntries(
          idsToDelete,
          commonArgs.organization_id,
          commonArgs.active_accounting_period_id,
          commonArgs.token,
          commonArgs.user_id,
        ),
      ).rejects.toThrow(mockError);
      expect(logger.error).toHaveBeenCalledWith({ dbError: mockError }, 'Journal Entries Service: Erro ao deletar múltiplos lançamentos via RPC:');
    });
  });

  describe('bulkUpdateJournalEntryStatus', () => {
    interface MockBulkUpdateQuery {
      from: Mock;
      update: Mock;
      in: Mock;
      eq: Mock;
      mockResolvedValueOnce: Mock; // This is a special case for the last eq
    }
    const createMockBulkUpdateQuery = (resolvedValue: unknown) => {
      const mockQuery: MockBulkUpdateQuery = {} as MockBulkUpdateQuery;
      mockQuery.from = vi.fn(() => mockQuery);
      mockQuery.update = vi.fn(() => mockQuery);
      mockQuery.in = vi.fn(() => mockQuery);
      mockQuery.eq = vi.fn(() => ({
        eq: vi.fn().mockResolvedValueOnce(resolvedValue),
      }));
      return mockQuery;
    };

    it('should bulk update journal entry status successfully', async () => {
      const idsToUpdate = ['id1', 'id2'];
      const newStatus = 'posted';

      (getSupabaseClient as vi.Mock).mockReturnValue(createMockBulkUpdateQuery({ error: null }));

      const result = await bulkUpdateJournalEntryStatus(
        idsToUpdate,
        newStatus,
        commonArgs.organization_id,
        commonArgs.active_accounting_period_id,
        commonArgs.token,
      );

      expect(getSupabaseClient).toHaveBeenCalledWith(commonArgs.token);
      expect(result).toBe(true);
    });

    it('should throw an error if bulk status update fails', async () => {
      const idsToUpdate = ['id1', 'id2'];
      const newStatus = 'posted';
      const mockError = new Error('Bulk Update Status Error');

      (getSupabaseClient as vi.Mock).mockReturnValue(createMockBulkUpdateQuery({ error: mockError }));

      await expect(
        bulkUpdateJournalEntryStatus(
          idsToUpdate,
          newStatus,
          commonArgs.organization_id,
          commonArgs.active_accounting_period_id,
          commonArgs.token,
        ),
      ).rejects.toThrow(mockError);
      expect(logger.error).toHaveBeenCalledWith({ dbError: mockError }, 'Journal Entries Service: Erro ao atualizar status de múltiplos lançamentos:');
    });
  });

  describe('checkDoubleEntryBalance', () => {
    interface MockCheckBalanceQuery {
      from: Mock;
      select: Mock;
      eq: Mock;
      mockImplementationOnce: Mock; // For mockImplementationOnce
    }
    const createMockCheckBalanceQuery = (resolvedValue: unknown) => {
      const mockQuery: MockCheckBalanceQuery = {} as MockCheckBalanceQuery;
      mockQuery.from = vi.fn(() => mockQuery);
      mockQuery.select = vi.fn(() => mockQuery);
      mockQuery.eq = vi.fn().mockResolvedValueOnce(resolvedValue);
      mockQuery.mockImplementationOnce = vi.fn().mockResolvedValueOnce(resolvedValue); // For mockImplementationOnce
      return mockQuery;
    };

    it('should return true for a balanced journal entry', async () => {
      (getSupabaseClient as vi.Mock).mockReturnValue(createMockCheckBalanceQuery({ data: [{ debit: 100, credit: 0 }, { debit: 0, credit: 100 }], error: null }));

      const result = await checkDoubleEntryBalance('journal-id-1', commonArgs.token);

      expect(getSupabaseClient).toHaveBeenCalledWith(commonArgs.token);
      expect(result).toBe(true);
    });

    it('should return false for an unbalanced journal entry', async () => {
      (getSupabaseClient as vi.Mock).mockReturnValue(createMockCheckBalanceQuery({ data: [{ debit: 100, credit: 0 }, { debit: 0, credit: 50 }], error: null }));

      const result = await checkDoubleEntryBalance('journal-id-2', commonArgs.token);

      expect(result).toBe(false);
      expect(logger.warn).toHaveBeenCalledWith(
        `Journal entry journal-id-2 is unbalanced. Debits: 100, Credits: 50`,
      );
    });

    it('should return true if no entry lines are found (depending on interpretation)', async () => {
      (getSupabaseClient as vi.Mock).mockReturnValue(createMockCheckBalanceQuery({ data: [], error: null }));

      const result = await checkDoubleEntryBalance('journal-id-3', commonArgs.token);

      expect(result).toBe(true); // Current implementation returns true for no lines
      expect(logger.warn).toHaveBeenCalledWith(
        `No entry lines found for journal entry journal-id-3.`,
      );
    });

    it('should return false if fetching entry lines fails', async () => {
      const mockError = new Error('Fetch Lines Error');

      (getSupabaseClient as vi.Mock).mockReturnValue(createMockCheckBalanceQuery({ data: null, error: mockError }));

      const result = await checkDoubleEntryBalance('journal-id-4', commonArgs.token);

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(
        { error: mockError }, // Expect the specific error instance
        `Error fetching entry lines for journal entry journal-id-4:`,
      );
    });

    it('should return false on unexpected error', async () => {
      (getSupabaseClient as vi.Mock).mockReturnValue({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn().mockImplementationOnce(() => {
              throw new Error('Unexpected error');
            }),
          })),
        })),
      });

      const result = await checkDoubleEntryBalance('journal-id-5', commonArgs.token);

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(
        expect.any(Error),
        expect.stringContaining('Unexpected error in checkDoubleEntryBalance for journal entry journal-id-5:'),
      );
    });
  });
});
import { api } from './api';
import type { EntryLine } from '@/types';

export async function createEntryLine(lineData: Omit<EntryLine, 'id'>): Promise<EntryLine> {
  const newLine = await api.post<EntryLine, Omit<EntryLine, 'id'>>('/entry-lines', lineData);
  return newLine;
}

export async function deleteEntryLinesByJournalEntryId(journalEntryId: string, organizationId: string, accountingPeriodId: string): Promise<void> {
  await api.delete(`/entry-lines?journal_entry_id=${journalEntryId}&organization_id=${organizationId}&accounting_period_id=${accountingPeriodId}`);
}

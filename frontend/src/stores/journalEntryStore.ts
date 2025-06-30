import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { JournalEntry, EntryLine } from '../types/index';
import { api } from '@/services/api';

export const useJournalEntryStore = defineStore('journalEntry', () => {
  const journalEntries = ref<JournalEntry[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchJournalEntries() {
    loading.value = true;
    error.value = null;
    try {
      const entriesData = await api.get<JournalEntry[]>('/journal-entries');

      const entriesWithLines = await Promise.all(entriesData.map(async (entry) => {
        try {
          const linesData = await api.get<any[]>(`/journal-entries/${entry.id}/lines`); // Use any[] for now
          const convertedLines: EntryLine[] = linesData.map(line => ({
            accountId: line.account_id,
            type: (line.debit && line.debit > 0) ? 'debit' : 'credit',
            amount: (line.debit || 0) > 0 ? (line.debit || 0) : (line.credit || 0),
            productId: line.product_id || undefined,
            quantity: line.quantity || undefined,
            unit_cost: line.unit_cost || undefined,
            total_gross: line.total_gross || undefined,
            icms_value: line.icms_value || undefined,
            total_net: line.total_net || undefined,
          }));
          return { ...entry, lines: convertedLines };
        } catch (lineError: unknown) { 
          console.error(`Erro ao buscar linhas para o lançamento ${entry.id}:`, lineError);
          if (lineError instanceof Error) {
            return { ...entry, lines: [], error: lineError.message }; 
          }
          return { ...entry, lines: [], error: 'Erro desconhecido ao carregar linhas.' };
        }
      }));

      journalEntries.value = entriesWithLines;
    } catch (err: unknown) { 
      console.error("Erro ao buscar lançamentos:", err);
      if (err instanceof Error) {
        error.value = err.message || 'Falha ao buscar lançamentos.';
      } else {
        error.value = 'Falha ao buscar lançamentos.';
      }
    } finally {
      loading.value = false;
    }
  }

  const getAllJournalEntries = computed(() => journalEntries.value);

  const getJournalEntryById = computed(() => (id: string) => {
    return journalEntries.value.find(entry => entry.id === id);
  });

  async function addJournalEntry(entry: JournalEntry) {
    loading.value = true;
    error.value = null;
    try {
      const { lines, ...entryHeader } = entry;
      const newJournalEntry = await api.post<JournalEntry>('/journal-entries', entryHeader);

      const newLines: EntryLine[] = [];
      for (const line of lines) {
        if (line.amount <= 0) {
          throw new Error('O valor do lançamento deve ser maior que zero.');
        }
        if (!['debit', 'credit'].includes(line.type)) {
          throw new Error('O tipo de lançamento (débito/crédito) é inválido.');
        }

        const lineToSend = {
          journal_entry_id: newJournalEntry.id,
          account_id: line.accountId,
          debit: line.type === 'debit' ? line.amount : 0,
          credit: line.type === 'credit' ? line.amount : 0,
          product_id: line.productId,
          quantity: line.quantity,
          unit_cost: line.unit_cost,
          total_gross: line.total_gross,
          icms_value: line.icms_value,
          total_net: line.total_net,
        };
        console.log('Sending line to API:', lineToSend); // Adicionado para depuração
        const newLine = await api.post<EntryLine>('/entry-lines', lineToSend);
        newLines.push(newLine);
      }

      journalEntries.value.push({ ...newJournalEntry, lines: newLines });
      return newJournalEntry;
    } catch (err: unknown) { 
      console.error("Erro ao adicionar lançamento:", err);
      if (err instanceof Error) {
        error.value = err.message || 'Falha ao adicionar lançamento.';
      } else {
        error.value = 'Falha ao adicionar lançamento.';
      }
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateEntry(updatedEntry: JournalEntry) {
    loading.value = true;
    error.value = null;
    try {
      const { lines, ...entryHeader } = updatedEntry;
      await api.put<JournalEntry>(`/journal-entries/${updatedEntry.id}`, entryHeader);

      await api.delete(`/journal-entries/${updatedEntry.id}/lines`);

      const newLines: EntryLine[] = [];
      for (const line of lines) {
        if (line.amount <= 0) {
          throw new Error('O valor do lançamento deve ser maior que zero.');
        }
        if (!['debit', 'credit'].includes(line.type)) {
          throw new Error('O tipo de lançamento (débito/crédito) é inválido.');
        }

        const lineToSend = {
          journal_entry_id: updatedEntry.id,
          account_id: line.accountId,
          debit: line.type === 'debit' ? line.amount : 0,
          credit: line.type === 'credit' ? line.amount : 0,
          product_id: line.productId,
          quantity: line.quantity,
          unit_cost: line.unit_cost,
          total_gross: line.total_gross,
          icms_value: line.icms_value,
          total_net: line.total_net,
        };
        console.log('Sending line to API:', lineToSend); // Adicionado para depuração
        const newLine = await api.post<EntryLine>('/entry-lines', lineToSend);
        newLines.push(newLine);
      }

      const index = journalEntries.value.findIndex(entry => entry.id === updatedEntry.id);
      if (index !== -1) {
        journalEntries.value[index] = { ...updatedEntry, lines: newLines };
      }
      return updatedEntry;
    } catch (err: unknown) { 
      console.error("Erro ao atualizar lançamento:", err);
      if (err instanceof Error) {
        error.value = err.message || 'Falha ao atualizar lançamento.';
      } else {
        error.value = 'Falha ao atualizar lançamento.';
      }
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteEntry(id: string) {
    loading.value = true;
    error.value = null;
    try {
      await api.delete(`/journal-entries/${id}`);
      journalEntries.value = journalEntries.value.filter(entry => entry.id !== id);
    } catch (err: unknown) { 
      console.error("Erro ao deletar lançamento:", err);
      if (err instanceof Error) {
        error.value = err.message || 'Falha ao deletar lançamento.';
      } else {
        error.value = 'Falha ao deletar lançamento.';
      }
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return {
    journalEntries,
    getAllJournalEntries,
    getJournalEntryById,
    fetchJournalEntries,
    addJournalEntry,
    updateEntry,
    deleteEntry,
    loading,
    error,
  };
});
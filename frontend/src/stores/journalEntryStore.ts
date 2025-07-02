import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { JournalEntry, EntryLine } from '../types/index';
import { api } from '@/services/api';
import { useToast } from 'primevue/usetoast';

export const useJournalEntryStore = defineStore('journalEntry', () => {
  const journalEntries = ref<JournalEntry[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const toast = useToast();

  async function fetchJournalEntries() {
    loading.value = true;
    error.value = null;
    try {
      const entriesData = await api.get<JournalEntry[]>('/journal-entries');

      const entriesWithLines = await Promise.all(entriesData.map(async (entry) => {
        try {
          const linesData = await api.get<EntryLine[]>(`/entry-lines?journal_entry_id=${entry.id}`);
          const convertedLines: EntryLine[] = linesData.map(line => ({
            account_id: line.account_id,
            type: (line.debit && line.debit > 0) ? 'debit' : 'credit',
            amount: (line.debit || 0) > 0 ? (line.debit || 0) : (line.credit || 0),
            product_id: line.product_id || undefined,
            quantity: line.quantity || undefined,
            unit_cost: line.unit_cost || undefined,
            total_gross: line.total_gross || undefined,
            icms_value: line.icms_value || undefined,
            total_net: line.total_net || undefined,
          }));
          return { ...entry, lines: convertedLines };
        } catch (err: unknown) {
          console.error("Erro ao buscar linhas do lançamento:", err);
          return null;
        }
      }));

      journalEntries.value = entriesWithLines.filter((entry): entry is JournalEntry => entry !== null);
    } catch (err: unknown) { 
      console.error("Erro ao buscar lançamentos:", err);
      error.value = (err instanceof Error) ? err.message : 'Falha ao buscar lançamentos.';
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
          account_id: line.account_id,
          debit: line.type === 'debit' ? line.amount : 0,
          credit: line.type === 'credit' ? line.amount : 0,
          product_id: line.product_id,
          quantity: line.quantity,
          unit_cost: line.unit_cost,
          total_gross: line.total_gross,
          icms_value: line.icms_value,
          total_net: line.total_net,
        };
        console.log('Sending line to API:', lineToSend); // Adicionado para depuração
        const newLine = await api.post<EntryLine>('/entry-lines', lineToSend);
        // Calcular e adicionar a propriedade 'amount' para a linha recém-criada
        const processedNewLine: EntryLine = {
          ...newLine,
          amount: (newLine.debit || 0) > 0 ? (newLine.debit || 0) : (newLine.credit || 0),
        };
        newLines.push(processedNewLine);
      }

      journalEntries.value.push({ ...newJournalEntry, lines: newLines });
      return newJournalEntry;
    } catch (err: unknown) { 
      console.error("Erro ao adicionar lançamento:", err);
      error.value = (err instanceof Error) ? err.message : 'Falha ao adicionar lançamento.';
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
          account_id: line.account_id,
          debit: line.type === 'debit' ? line.amount : 0,
          credit: line.type === 'credit' ? line.amount : 0,
          product_id: line.product_id,
          quantity: line.quantity,
          unit_cost: line.unit_cost,
          total_gross: line.total_gross,
          icms_value: line.icms_value,
          total_net: line.total_net,
        };
        console.log('Sending line to API:', lineToSend); // Adicionado para depuração
        const newLine = await api.post<EntryLine>('/entry-lines', lineToSend);
        // Calcular e adicionar a propriedade 'amount' para a linha recém-criada
        const processedNewLine: EntryLine = {
          ...newLine,
          amount: (newLine.debit || 0) > 0 ? (newLine.debit || 0) : (newLine.credit || 0),
        };
        newLines.push(processedNewLine);
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
      error.value = (err instanceof Error) ? err.message : 'Falha ao deletar lançamento.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function reverseJournalEntry(originalEntryId: string) {
    loading.value = true;
    error.value = null;
    try {
      const originalEntry = journalEntries.value.find(entry => entry.id === originalEntryId);
      if (!originalEntry) {
        throw new Error('Lançamento original não encontrado para estorno.');
      }

      const reversedLines: Omit<EntryLine, 'id'>[] = originalEntry.lines.map(line => ({
        account_id: line.account_id,
        type: line.type === 'debit' ? 'credit' : 'debit',
        amount: line.amount,
        product_id: line.product_id,
        quantity: line.quantity,
        unit_cost: line.unit_cost,
        icms_rate: line.icms_rate,
        total_gross: line.total_gross,
        icms_value: line.icms_value,
        total_net: line.total_net,
      }));

      const reversalEntry: Omit<JournalEntry, 'lines' | 'id'> & { id?: string, lines: Omit<EntryLine, 'id'>[] } = {
        entry_date: new Date().toISOString().split('T')[0],
        description: `Estorno do Lançamento ${originalEntry.id} - ${originalEntry.description}`,
        lines: reversedLines,
      };

      await addJournalEntry(reversalEntry as JournalEntry);
      toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Lançamento estornado com sucesso!', life: 3000 });
    } catch (err: unknown) { 
      console.error("Erro ao estornar lançamento:", err);
      error.value = (err instanceof Error) ? err.message : 'Falha ao estornar lançamento.';
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
    reverseJournalEntry,
    loading,
    error,
  };
});
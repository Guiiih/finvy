import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { JournalEntry, EntryLine, JournalEntryPayload } from '../types/index'
import { api } from '@/services/api'
import { useToast } from 'primevue/usetoast'
import { useAccountingPeriodStore } from './accountingPeriodStore'
import { supabase } from '@/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { createEntryLine, deleteEntryLinesByJournalEntryId } from '@/services/entryLineService';

export const useJournalEntryStore = defineStore('journalEntry', () => {
  const journalEntries = ref<JournalEntry[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const toast = useToast()
  const realtimeChannel = ref<RealtimeChannel | null>(null);

  const accountingPeriodStore = useAccountingPeriodStore();

  watch(
    () => accountingPeriodStore.activeAccountingPeriod,
    (newPeriod, oldPeriod) => {
      if (newPeriod && newPeriod.id !== oldPeriod?.id) {
        unsubscribeFromRealtime();
        fetchJournalEntries();
      }
    },
    { deep: true }
  );

  async function fetchJournalEntries() {
    loading.value = true;
    error.value = null;
    try {
      if (!accountingPeriodStore.activeAccountingPeriod?.id) {
        await accountingPeriodStore.fetchAccountingPeriods();
      }
      const orgId = accountingPeriodStore.activeAccountingPeriod!.organization_id;
      const periodId = accountingPeriodStore.activeAccountingPeriod!.id;

      const entriesData = await api.get<JournalEntry[]>('/journal-entries', {
        params: {
          organization_id: orgId,
          accounting_period_id: periodId,
        },
      });

      if (!Array.isArray(entriesData)) {
        console.error('Dados da API não são um array:', entriesData);
        journalEntries.value = [];
        return;
      }

      const entriesWithLines = await Promise.all(
        entriesData.map(async (entry) => {
          try {
            const linesData = await api.get<EntryLine[]>(
              `/entry-lines?journal_entry_id=${entry.id}&organization_id=${orgId}&accounting_period_id=${periodId}`,
            );
            const convertedLines: EntryLine[] = linesData.map((line) => ({
              account_id: line.account_id,
              type: line.debit && line.debit > 0 ? 'debit' : 'credit',
              amount: (line.debit || 0) > 0 ? line.debit || 0 : line.credit || 0,
              product_id: line.product_id || undefined,
              quantity: line.quantity || undefined,
              unit_cost: line.unit_cost || undefined,
              total_gross: line.total_gross || undefined,
              icms_value: line.icms_value || undefined,
              total_net: line.total_net || undefined,
            }));
            return { ...entry, lines: convertedLines };
          } catch (err: unknown) {
            console.error('Erro ao buscar linhas do lançamento:', err);
            return null;
          }
        }),
      );

      journalEntries.value = entriesWithLines.filter(
        (entry): entry is JournalEntry => entry !== null,
      );

      subscribeToRealtime(orgId, periodId);

    } catch (err: unknown) {
      console.error('Erro ao buscar lançamentos:', err);
      error.value = err instanceof Error ? err.message : 'Falha ao buscar lançamentos.';
    } finally {
      loading.value = false;
    }
  }

  function subscribeToRealtime(orgId: string, periodId: string) {
    if (realtimeChannel.value) {
      supabase.removeChannel(realtimeChannel.value as RealtimeChannel);
    }

    if (!orgId || !periodId) {
      console.warn("Não é possível assinar o Realtime: organization_id ou accounting_period_id ausente.");
      return;
    }

    realtimeChannel.value = supabase
      .channel(`journal_entries_org_${orgId}_period_${periodId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'journal_entries',
          filter: `organization_id=eq.${orgId},accounting_period_id=eq.${periodId}`,
        },
        (payload) => {
          console.log('Realtime change received!', payload);
          const newEntry = payload.new as JournalEntry;
          const oldEntry = payload.old as JournalEntry;

          if (payload.eventType === 'INSERT') {
            if (!journalEntries.value.some(entry => entry.id === newEntry.id)) {
              journalEntries.value.push({ ...newEntry, lines: [] });
            }
          } else if (payload.eventType === 'UPDATE') {
            const index = journalEntries.value.findIndex(entry => entry.id === newEntry.id);
            if (index !== -1) {
              journalEntries.value[index] = { ...journalEntries.value[index], ...newEntry };
            }
          } else if (payload.eventType === 'DELETE') {
            journalEntries.value = journalEntries.value.filter(entry => entry.id !== oldEntry.id);
          }
        },
      )
      .subscribe();
  }

  function unsubscribeFromRealtime() {
    if (realtimeChannel.value) {
      supabase.removeChannel(realtimeChannel.value as RealtimeChannel);
      realtimeChannel.value = null;
    }
  }

  const getAllJournalEntries = computed(() => journalEntries.value)

  const getJournalEntryById = computed(() => (id: string) => {
    return journalEntries.value.find((entry) => entry.id === id)
  })

  async function addJournalEntry(entry: Omit<JournalEntry, 'id'>) {
    loading.value = true;
    error.value = null;
    try {
      if (!accountingPeriodStore.activeAccountingPeriod?.id) {
        throw new Error('Nenhum período contábil ativo selecionado.');
      }
      const { lines, ...entryHeader } = entry;
      const newJournalEntry = await api.post<JournalEntry, JournalEntryPayload>(
        '/journal-entries',
        {
          ...entryHeader,
          organization_id: accountingPeriodStore.activeAccountingPeriod.organization_id,
          accounting_period_id: accountingPeriodStore.activeAccountingPeriod.id,
        },
      );

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
          type: line.type,
          amount: line.amount,
          debit: line.type === 'debit' ? line.amount : 0,
          credit: line.type === 'credit' ? line.amount : 0,
          product_id: line.product_id,
          quantity: line.quantity,
          unit_cost: line.unit_cost,
          total_gross: line.total_gross,
          icms_value: line.icms_value,
          total_net: line.total_net,
          organization_id: accountingPeriodStore.activeAccountingPeriod.organization_id,
          accounting_period_id: accountingPeriodStore.activeAccountingPeriod.id,
        };
        console.log('Sending line to API:', lineToSend);
        const newLine = await createEntryLine(lineToSend);
        const processedNewLine: EntryLine = {
          ...newLine,
          amount: (newLine.debit || 0) > 0 ? newLine.debit || 0 : newLine.credit || 0,
        };
        newLines.push(processedNewLine);
      }

      journalEntries.value.push({ ...newJournalEntry, lines: newLines });
      return newJournalEntry;
    } catch (err: unknown) {
      console.error('Erro ao adicionar lançamento:', err);
      error.value = err instanceof Error ? err.message : 'Falha ao adicionar lançamento.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateEntry(updatedEntry: JournalEntry) {
    loading.value = true
    error.value = null
    try {
      const { lines, ...entryHeader } = updatedEntry;
      await api.put<JournalEntry, JournalEntryPayload>(
        `/journal-entries/${updatedEntry.id}`,
        {
          ...entryHeader,
          organization_id: accountingPeriodStore.activeAccountingPeriod!.organization_id,
          accounting_period_id: accountingPeriodStore.activeAccountingPeriod!.id,
        },
      );

      await deleteEntryLinesByJournalEntryId(updatedEntry.id, accountingPeriodStore.activeAccountingPeriod!.organization_id, accountingPeriodStore.activeAccountingPeriod!.id);

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
          account_id: line.account_id,
          type: line.type,
          amount: line.amount,
          debit: line.type === 'debit' ? line.amount : 0,
          credit: line.type === 'credit' ? line.amount : 0,
          product_id: line.product_id,
          quantity: line.quantity,
          unit_cost: line.unit_cost,
          total_gross: line.total_gross,
          icms_value: line.icms_value,
          total_net: line.total_net,
          organization_id: accountingPeriodStore.activeAccountingPeriod!.organization_id,
          accounting_period_id: accountingPeriodStore.activeAccountingPeriod!.id,
        };
        console.log('Sending line to API:', lineToSend);
        const newLine = await createEntryLine(lineToSend);
        const processedNewLine: EntryLine = {
          ...newLine,
          amount: (newLine.debit || 0) > 0 ? newLine.debit || 0 : newLine.credit || 0,
        };
        newLines.push(processedNewLine);
      }

      const index = journalEntries.value.findIndex((entry) => entry.id === updatedEntry.id)
      if (index !== -1) {
        journalEntries.value[index] = { ...updatedEntry, lines: newLines }
      }
      return updatedEntry
    } catch (err: unknown) {
      console.error('Erro ao atualizar lançamento:', err)
      if (err instanceof Error) {
        error.value = err.message || 'Falha ao atualizar lançamento.'
      } else {
        error.value = 'Falha ao atualizar lançamento.'
      }
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteEntry(id: string) {
    loading.value = true
    error.value = null
    console.log('JournalEntryStore: Tentando deletar lançamento com ID:', id);
    try {
      await api.delete(`/journal-entries/${id}`)
      journalEntries.value = journalEntries.value.filter((entry) => entry.id !== id)
      console.log('JournalEntryStore: Lançamento deletado com sucesso no frontend.');
    } catch (err: unknown) {
      console.error('JournalEntryStore: Erro ao deletar lançamento:', err)
      error.value = err instanceof Error ? err.message : 'Falha ao deletar lançamento.'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function reverseJournalEntry(originalEntryId: string) {
    loading.value = true
    error.value = null
    try {
      const originalEntry = journalEntries.value.find((entry) => entry.id === originalEntryId)
      if (!originalEntry) {
        throw new Error('Lançamento original não encontrado para estorno.')
      }

      const reversedLines: Omit<EntryLine, 'id'>[] = originalEntry.lines.map((line) => ({
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
      }))

      const reversalEntry: Omit<JournalEntry, 'lines' | 'id'> & {
        id?: string
        lines: Omit<EntryLine, 'id'>[]
      } = {
        entry_date: new Date().toISOString().split('T')[0],
        description: `Estorno do Lançamento ${originalEntry.id} - ${originalEntry.description}`,
        lines: reversedLines,
      }

      await addJournalEntry(reversalEntry as JournalEntry)
      toast.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: 'Lançamento estornado com sucesso!',
        life: 3000,
      })
    } catch (err: unknown) {
      console.error('Erro ao estornar lançamento:', err)
      error.value = err instanceof Error ? err.message : 'Falha ao estornar lançamento.'
      throw err
    } finally {
      loading.value = false
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
    unsubscribeFromRealtime,
  }
})
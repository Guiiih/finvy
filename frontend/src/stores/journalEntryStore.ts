import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { JournalEntry, EntryLine, JournalEntryPayload, JournalEntryHistory } from '@/types/index'
import { api } from '@/services/api'
import { useToast } from 'primevue/usetoast'
import { useAccountingPeriodStore } from './accountingPeriodStore'
import { useAuthStore } from './authStore'
import { supabase } from '@/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { createEntryLine } from '@/services/entryLineService'

export const useJournalEntryStore = defineStore('journalEntry', () => {
  const journalEntries = ref<JournalEntry[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const totalJournalEntries = ref(0)
  const toast = useToast()
  const realtimeChannel = ref<RealtimeChannel | null>(null)

  const accountingPeriodStore = useAccountingPeriodStore()
  const authStore = useAuthStore()

  watch(
    () => [accountingPeriodStore.activeAccountingPeriod, authStore.profileLoaded],
    ([newPeriod, isProfileLoaded], [oldPeriod]) => {
      const currentPeriod = newPeriod as typeof accountingPeriodStore.activeAccountingPeriod
      const previousPeriod = oldPeriod as typeof accountingPeriodStore.activeAccountingPeriod

      if (currentPeriod && currentPeriod.id !== previousPeriod?.id && isProfileLoaded) {
        unsubscribeFromRealtime()
        fetchJournalEntries()
      } else if (isProfileLoaded && !currentPeriod) {
        // Caso o perfil seja carregado, mas não haja período ativo (ex: primeiro login)
        fetchJournalEntries()
      }
    },
    { deep: true },
  )

  async function fetchJournalEntries(
    page: number = 1,
    itemsPerPage: number = 10,
    status: string | null = null,
    filters: {
      dateFrom: string | null
      dateTo: string | null
      amountFrom: number | null
      amountTo: number | null
      createdBy: string | null
      hasProduct: boolean
      hasTaxes: boolean
      accounts: string[]
    } | null = null,
  ) {
    loading.value = true
    error.value = null
    try {
      if (!accountingPeriodStore.activeAccountingPeriod?.id) {
        await accountingPeriodStore.fetchAccountingPeriods()
      }

      const activePeriod = accountingPeriodStore.activeAccountingPeriod
      if (!activePeriod || !activePeriod.organization_id || !activePeriod.id) {
        console.warn(
          'Não foi possível obter organization_id ou accounting_period_id após fetchAccountingPeriods.',
        )
        return // Sai da função se os IDs ainda não estiverem disponíveis
      }

      const orgId = activePeriod.organization_id
      const periodId = activePeriod.id

      interface JournalEntrySearchParams {
        organization_id: string;
        accounting_period_id: string;
        _page: number;
        _limit: number;
        status?: string | null;
        dateFrom?: string | null;
        dateTo?: string | null;
        amountFrom?: number | null;
        amountTo?: number | null;
        createdBy?: string | null;
        hasProduct?: boolean;
        hasTaxes?: boolean;
        accounts?: string;
        [key: string]: unknown; // Adiciona a assinatura de índice
      }

      const params: JournalEntrySearchParams = {
        organization_id: orgId,
        accounting_period_id: periodId,
        _page: page,
        _limit: itemsPerPage,
      }

      if (status) {
        params.status = status
      }

      // Adicionar filtros avançados aos parâmetros
      if (filters) {
        if (filters.dateFrom) params.dateFrom = filters.dateFrom
        if (filters.dateTo) params.dateTo = filters.dateTo
        if (filters.amountFrom !== null) params.amountFrom = filters.amountFrom
        if (filters.amountTo !== null) params.amountTo = filters.amountTo
        if (filters.createdBy) params.createdBy = filters.createdBy
        if (filters.hasProduct) params.hasProduct = filters.hasProduct
        if (filters.hasTaxes) params.hasTaxes = filters.hasTaxes
        if (filters.accounts && filters.accounts.length > 0)
          params.accounts = filters.accounts.join(',') // Enviar como string separada por vírgulas
      }

      const response = await api.get<{ data: JournalEntry[]; count: number }>('/journal-entries', {
        params: params,
      })

      const entriesData = response.data
      totalJournalEntries.value = response.count

      if (!Array.isArray(entriesData)) {
        console.error('Dados da API não são um array:', response)
        journalEntries.value = []
        return
      }

      const entriesWithLines = await Promise.all(
        entriesData.map(async (entry) => {
          try {
            const linesData = await api.get<EntryLine[]>(
              `/entry-lines?journal_entry_id=${entry.id}&organization_id=${orgId}&accounting_period_id=${periodId}`,
            )
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
            }))
            return { ...entry, lines: convertedLines }
          } catch (err: unknown) {
            console.error('Erro ao buscar linhas do lançamento:', err)
            return null
          }
        }),
      )

      journalEntries.value = entriesWithLines.filter(
        (entry): entry is JournalEntry => entry !== null,
      )

      subscribeToRealtime(orgId, periodId)
    } catch (err: unknown) {
      console.error('Erro ao buscar lançamentos:', err)
      error.value = err instanceof Error ? err.message : 'Falha ao buscar lançamentos.'
    } finally {
      loading.value = false
    }
  }

  function subscribeToRealtime(orgId: string, periodId: string) {
    if (realtimeChannel.value) {
      supabase.removeChannel(realtimeChannel.value as RealtimeChannel)
    }

    if (!orgId || !periodId || !authStore.profileLoaded) {
      console.warn(
        'Não é possível assinar o Realtime: organization_id, accounting_period_id ou perfil ausente.',
      )
      return
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
          console.log('Realtime change received!', payload)
          const newEntry = payload.new as JournalEntry
          const oldEntry = payload.old as JournalEntry

          if (payload.eventType === 'INSERT') {
            if (newEntry && !journalEntries.value.some((entry) => entry.id === newEntry.id)) {
              journalEntries.value.push({ ...newEntry, lines: [] })
            }
          } else if (payload.eventType === 'UPDATE') {
            if (newEntry) {
              const index = journalEntries.value.findIndex((entry) => entry.id === newEntry.id)
              if (index !== -1) {
                journalEntries.value[index] = { ...journalEntries.value[index], ...newEntry }
              }
            }
          } else if (payload.eventType === 'DELETE') {
            if (oldEntry) {
              journalEntries.value = journalEntries.value.filter(
                (entry) => entry.id !== oldEntry.id,
              )
            }
          }
        },
      )
      .subscribe()
  }

  function unsubscribeFromRealtime() {
    if (realtimeChannel.value) {
      supabase.removeChannel(realtimeChannel.value as RealtimeChannel)
      realtimeChannel.value = null
    }
  }

  const getAllJournalEntries = computed(() => journalEntries.value)

  const getJournalEntryById = computed(() => (id: string) => {
    return journalEntries.value.find((entry) => entry.id === id)
  })

  async function addJournalEntry(entry: Omit<JournalEntry, 'id'>) {
    loading.value = true
    error.value = null
    try {
      if (!accountingPeriodStore.activeAccountingPeriod?.id) {
        throw new Error('Nenhum período contábil ativo selecionado.')
      }
      const { lines, ...entryHeader } = entry
      const payload: JournalEntryPayload = {
        ...entryHeader,
        organization_id: accountingPeriodStore.activeAccountingPeriod.organization_id,
        accounting_period_id: accountingPeriodStore.activeAccountingPeriod.id,
      }
      const newJournalEntry = await api.post<JournalEntry, JournalEntryPayload>(
        '/journal-entries',
        payload,
      )

      const newLines: EntryLine[] = []
      for (const line of lines) {
        if (line.amount <= 0) {
          throw new Error('O valor do lançamento deve ser maior que zero.')
        }
        if (!['debit', 'credit'].includes(line.type)) {
          throw new Error('O tipo de lançamento (débito/crédito) é inválido.')
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
        }
        console.log('Sending line to API:', lineToSend)
        const newLine = await createEntryLine(lineToSend)
        const processedNewLine: EntryLine = {
          ...newLine,
          amount: (newLine.debit || 0) > 0 ? newLine.debit || 0 : newLine.credit || 0,
        }
        newLines.push(processedNewLine)
      }

      await fetchJournalEntries()

      return newJournalEntry
    } catch (err: unknown) {
      console.error('Erro ao adicionar lançamento:', err)
      error.value = err instanceof Error ? err.message : 'Falha ao adicionar lançamento.'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateEntry(updatedEntry: JournalEntry) {
    loading.value = true
    error.value = null
    try {
      const { ...entryHeader } = updatedEntry
      const payload: JournalEntryPayload = {
        ...entryHeader,
        organization_id: accountingPeriodStore.activeAccountingPeriod!.organization_id,
        accounting_period_id: accountingPeriodStore.activeAccountingPeriod!.id,
      }
      await api.put<JournalEntry, JournalEntryPayload>(
        `/journal-entries/${updatedEntry.id}`,
        payload,
      )

      const index = journalEntries.value.findIndex((entry) => entry.id === updatedEntry.id)
      if (index !== -1) {
        journalEntries.value[index] = { ...updatedEntry, lines: updatedEntry.lines }
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
    console.log(`JournalEntryStore: Tentando deletar lançamento com ID: ${id}`)

    try {
      // 1. Chama a API para deletar o registro no backend.
      await api.delete(`/journal-entries/${id}`)

      // 2. Se a chamada for bem-sucedida, atualiza o estado local imediatamente.
      const index = journalEntries.value.findIndex((entry) => entry.id === id)
      if (index !== -1) {
        journalEntries.value.splice(index, 1)
        if (totalJournalEntries.value > 0) {
          totalJournalEntries.value--
        }
      }

      console.log(`JournalEntryStore: Lançamento ${id} deletado com sucesso do estado.`)

      // 3. Adiciona uma notificação de sucesso para o usuário.
      toast.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: 'Lançamento deletado com sucesso!',
        life: 3000,
      })
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Falha ao deletar lançamento.'
      error.value = errorMessage
      console.error(`JournalEntryStore: Erro ao deletar lançamento ${id}:`, err)

      // 4. Adiciona uma notificação de erro caso a API falhe.
      toast.add({
        severity: 'error',
        summary: 'Erro ao Deletar',
        detail: String(err),
        life: 5000,
      })

      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteMultipleEntries(ids: string[]) {
    loading.value = true
    error.value = null
    try {
      await api.post('/journal-entries/bulk-delete', { ids })
      journalEntries.value = journalEntries.value.filter((entry) => !ids.includes(entry.id as string))
      totalJournalEntries.value -= ids.length
    } catch (err: unknown) {
      console.error('Erro ao deletar múltiplos lançamentos:', err)
      error.value = err instanceof Error ? err.message : 'Falha ao deletar múltiplos lançamentos.'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateMultipleEntriesStatus(ids: string[], status: 'draft' | 'posted' | 'reviewed') {
    loading.value = true
    error.value = null
    try {
      await api.post('/journal-entries/bulk-update-status', { ids, status })
      journalEntries.value = journalEntries.value.map((entry) =>
        ids.includes(entry.id as string) ? { ...entry, status } : entry,
      )
    } catch (err: unknown) {
      console.error('Erro ao atualizar status de múltiplos lançamentos:', err)
      error.value = err instanceof Error ? err.message : 'Falha ao atualizar status de múltiplos lançamentos.'
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
        reference: `ESTORNO-${originalEntry.reference || originalEntry.id}`,
        status: 'posted',
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

  async function fetchJournalEntryHistory(entryId: string): Promise<JournalEntryHistory[]> {
    try {
      const response = await api.get<JournalEntryHistory[]>(`/journal-entries/${entryId}/history`)
      return response
    } catch (err: unknown) {
      console.error('Erro ao buscar histórico do lançamento:', err)
      const message = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.'
      toast.add({ severity: 'error', summary: 'Erro', detail: message, life: 3000 })
      return []
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
    deleteMultipleEntries,
    updateMultipleEntriesStatus,
    reverseJournalEntry,
    loading,
    error,
    unsubscribeFromRealtime,
    totalJournalEntries,
    fetchJournalEntryHistory,
  }
})

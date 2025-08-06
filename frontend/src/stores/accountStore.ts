import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Account } from '@/types'
import { api } from '@/services/api'
import { useAccountingPeriodStore } from './accountingPeriodStore'

export const useAccountStore = defineStore('account', () => {
  const accounts = ref<Account[]>([])
  const totalAccounts = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const accountingPeriodStore = useAccountingPeriodStore()

  const getAllAccounts = computed(() => accounts.value)

  const getAccountById = computed(() => (id: string) => {
    return accounts.value.find((account) => account.id === id)
  })

  const getAccountByName = computed(() => (name: string) => {
    return accounts.value.find((account) => account.name === name)
  })

  const accountTypes = computed(() => {
    const types = new Set<string>()
    accounts.value.forEach((account) => types.add(account.type))
    return Array.from(types)
  })

  async function fetchAccounts() {
    loading.value = true
    error.value = null
    try {
      if (!accountingPeriodStore.activeAccountingPeriod?.id) {
        await accountingPeriodStore.fetchAccountingPeriods()
      }
      const response = await api.get<{ data: Account[]; count: number }>('/accounts', {
        params: {
          organization_id: accountingPeriodStore.activeAccountingPeriod?.organization_id,
          accounting_period_id: accountingPeriodStore.activeAccountingPeriod?.id,
          page: 1,
          limit: 1000, // Buscar todas as contas para paginação no frontend
        },
      })
      accounts.value = Array.isArray(response.data) ? response.data : []
      totalAccounts.value = response.count || 0
    } catch (err: unknown) {
      console.error('Erro ao buscar contas:', err)
      if (err instanceof Error) {
        error.value = err.message
      } else {
        error.value = 'Ocorreu uma falha desconhecida ao buscar contas.'
      }
    } finally {
      loading.value = false
    }
  }

  async function fetchAccountsByType(type: string) {
    loading.value = true
    error.value = null
    try {
      if (!accountingPeriodStore.activeAccountingPeriod?.id) {
        await accountingPeriodStore.fetchAccountingPeriods()
      }
      const response = await api.get<{ data: Account[]; count: number }>('/accounts/by-type', {
        params: {
          organization_id: accountingPeriodStore.activeAccountingPeriod?.organization_id,
          accounting_period_id: accountingPeriodStore.activeAccountingPeriod?.id,
          type,
        },
      })
      return Array.isArray(response.data) ? response.data : []
    } catch (err: unknown) {
      console.error('Erro ao buscar contas por tipo:', err)
      if (err instanceof Error) {
        error.value = err.message
      } else {
        error.value = 'Ocorreu uma falha desconhecida ao buscar contas por tipo.'
      }
      return []
    } finally {
      loading.value = false
    }
  }

  async function addAccount(newAccount: Omit<Account, 'id'>) {
    loading.value = true
    error.value = null
    try {
      if (!accountingPeriodStore.activeAccountingPeriod?.id) {
        throw new Error('Nenhum período contábil ativo selecionado.')
      }
      const payload = {
        ...newAccount,
        organization_id: accountingPeriodStore.activeAccountingPeriod.organization_id,
        accounting_period_id: accountingPeriodStore.activeAccountingPeriod.id,
      }
      const addedAccount = await api.post<Account, Omit<Account, 'id'>>('/accounts', payload)
      await fetchAccounts()
      return addedAccount
    } catch (err: unknown) {
      console.error('Erro ao adicionar conta:', err)
      error.value = err instanceof Error ? err.message : 'Falha ao adicionar conta.'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateAccount(id: string, updatedFields: Partial<Account>) {
    loading.value = true
    error.value = null
    try {
      const response = await api.put<Account, Partial<Account>>(`/accounts/${id}`, updatedFields)
      const index = accounts.value.findIndex((acc) => acc.id === id)
      if (index !== -1) {
        accounts.value[index] = { ...accounts.value[index], ...response }
      }
      return response
    } catch (err: unknown) {
      console.error('Erro ao atualizar conta:', err)
      error.value = err instanceof Error ? err.message : 'Falha ao atualizar conta.'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteAccount(id: string) {
    loading.value = true
    error.value = null
    try {
      await api.delete(`/accounts/${id}`)
      await fetchAccounts()
    } catch (err: unknown) {
      console.error('Erro ao deletar conta:', err)
      error.value = err instanceof Error ? err.message : 'Falha ao deletar conta.'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    accounts,
    totalAccounts,
    loading,
    error,
    fetchAccounts,
    fetchAccountsByType,
    addAccount,
    updateAccount,
    deleteAccount,
    getAllAccounts,
    getAccountById,
    getAccountByName,
    accountTypes,
  }
})

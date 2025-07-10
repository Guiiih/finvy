import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Account } from '@/types'
import { api } from '@/services/api'
import { useAccountingPeriodStore } from './accountingPeriodStore'

export const useAccountStore = defineStore('account', () => {
  const accounts = ref<Account[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const accountingPeriodStore = useAccountingPeriodStore();

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

  const getAccountsByType = computed(() => (type: string) => {
    return accounts.value.filter((account) => account.type === type)
  })

  async function fetchAccounts() {
    loading.value = true;
    error.value = null;
    try {
      if (!accountingPeriodStore.activeAccountingPeriod?.id) {
        await accountingPeriodStore.fetchAccountingPeriods();
      }
      const data = await api.get<Account[]>('/accounts', {
        params: {
          organization_id: accountingPeriodStore.activeAccountingPeriod?.organization_id,
          accounting_period_id: accountingPeriodStore.activeAccountingPeriod?.id,
        },
      });
      accounts.value = data;
    } catch (err: unknown) {
      console.error('Erro ao buscar contas:', err);
      if (err instanceof Error) {
        error.value = err.message;
      } else {
        error.value = 'Ocorreu uma falha desconhecida ao buscar contas.';
      }
    } finally {
      loading.value = false;
    }
  }

  async function addAccount(newAccount: Omit<Account, 'id'>) {
    loading.value = true;
    error.value = null;
    try {
      if (!accountingPeriodStore.activeAccountingPeriod?.id) {
        throw new Error('Nenhum período contábil ativo selecionado.');
      }
      const payload = {
        ...newAccount,
        organization_id: accountingPeriodStore.activeAccountingPeriod.organization_id,
        accounting_period_id: accountingPeriodStore.activeAccountingPeriod.id,
      };
      const addedAccount = await api.post<Account, Omit<Account, 'id'>>('/accounts', payload);
      accounts.value.push(addedAccount);
      return addedAccount;
    } catch (err: unknown) {
      console.error('Erro ao adicionar conta:', err);
      error.value = err instanceof Error ? err.message : 'Falha ao adicionar conta.';
      throw err;
    } finally {
      loading.value = false;
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
      accounts.value = accounts.value.filter((acc) => acc.id !== id)
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
    loading,
    error,
    fetchAccounts,
    addAccount,
    updateAccount,
    deleteAccount,
    getAllAccounts,
    getAccountById,
    getAccountByName,
    accountTypes,
    getAccountsByType,
  }
})
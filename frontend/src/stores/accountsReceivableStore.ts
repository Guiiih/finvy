import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@/services/api';

interface AccountsReceivable {
  id: string;
  description: string;
  amount: number;
  due_date: string;
  received_date?: string | null;
  is_received: boolean;
  created_at: string;
}

export const useAccountsReceivableStore = defineStore('accountsReceivable', () => {
  const accountsReceivable = ref<AccountsReceivable[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchAccountsReceivable() {
    loading.value = true;
    error.value = null;
    try {
      const data = await api.get<AccountsReceivable[]>('/accounts-receivable');
      accountsReceivable.value = data;
    } catch (err: unknown) {
      console.error('Erro ao buscar contas a receber:', err);
      if (err instanceof Error) {
        error.value = err.message || 'Falha ao buscar contas a receber.';
      } else {
        error.value = 'Falha ao buscar contas a receber.';
      }
    } finally {
      loading.value = false;
    }
  }

  async function addAccountReceivable(newAccount: Omit<AccountsReceivable, 'id' | 'created_at' | 'is_received'>) {
    loading.value = true;
    error.value = null;
    try {
      const data = await api.post<AccountsReceivable>('/accounts-receivable', newAccount);
      accountsReceivable.value.push(data);
      return data;
    } catch (err: unknown) {
      console.error('Erro ao adicionar conta a receber:', err);
      if (err instanceof Error) {
        error.value = err.message || 'Falha ao adicionar conta a receber.';
      } else {
        error.value = 'Falha ao adicionar conta a receber.';
      }
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateAccountReceivable(id: string, updatedFields: Partial<Omit<AccountsReceivable, 'id' | 'created_at'>>) {
    loading.value = true;
    error.value = null;
    try {
      const data = await api.put<AccountsReceivable>(`/accounts-receivable/${id}`, updatedFields);
      const index = accountsReceivable.value.findIndex(acc => acc.id === id);
      if (index !== -1) {
        accountsReceivable.value[index] = { ...accountsReceivable.value[index], ...data };
      }
      return data;
    } catch (err: unknown) {
      console.error('Erro ao atualizar conta a receber:', err);
      if (err instanceof Error) {
        error.value = err.message || 'Falha ao atualizar conta a receber.';
      } else {
        error.value = 'Falha ao atualizar conta a receber.';
      }
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteAccountReceivable(id: string) {
    loading.value = true;
    error.value = null;
    try {
      await api.delete(`/accounts-receivable/${id}`);
      accountsReceivable.value = accountsReceivable.value.filter(acc => acc.id !== id);
    } catch (err: unknown) {
      console.error('Erro ao deletar conta a receber:', err);
      if (err instanceof Error) {
        error.value = err.message || 'Falha ao deletar conta a receber.';
      } else {
        error.value = 'Falha ao deletar conta a receber.';
      }
      throw err;
    } finally {
      loading.value = false;
    }
  }

  const getAccountsReceivable = computed(() => accountsReceivable.value);
  const getUnreceivedAccounts = computed(() => accountsReceivable.value.filter(acc => !acc.is_received));
  const getReceivedAccounts = computed(() => accountsReceivable.value.filter(acc => acc.is_received));

  return {
    accountsReceivable,
    loading,
    error,
    fetchAccountsReceivable,
    addAccountReceivable,
    updateAccountReceivable,
    deleteAccountReceivable,
    getAccountsReceivable,
    getUnreceivedAccounts,
    getReceivedAccounts,
  };
});
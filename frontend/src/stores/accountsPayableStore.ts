import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@/services/api';

interface AccountsPayable {
  id: string;
  description: string;
  amount: number;
  due_date: string;
  paid_date?: string | null;
  is_paid: boolean;
  created_at: string;
}

export const useAccountsPayableStore = defineStore('accountsPayable', () => {
  const accountsPayable = ref<AccountsPayable[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchAccountsPayable() {
    loading.value = true;
    error.value = null;
    try {
      const data = await api.get<AccountsPayable[]>('/accounts-payable');
      accountsPayable.value = data;
    } catch (err: unknown) {
      console.error('Erro ao buscar contas a pagar:', err);
      if (err instanceof Error) {
        error.value = err.message || 'Falha ao buscar contas a pagar.';
      } else {
        error.value = 'Falha ao buscar contas a pagar.';
      }
    } finally {
      loading.value = false;
    }
  }

  async function addAccountPayable(newAccount: Omit<AccountsPayable, 'id' | 'created_at' | 'is_paid'>) {
    loading.value = true;
    error.value = null;
    try {
      const data = await api.post<AccountsPayable>('/accounts-payable', newAccount);
      accountsPayable.value.push(data);
      return data;
    } catch (err: unknown) {
      console.error('Erro ao adicionar conta a pagar:', err);
      if (err instanceof Error) {
        error.value = err.message || 'Falha ao adicionar conta a pagar.';
      } else {
        error.value = 'Falha ao adicionar conta a pagar.';
      }
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateAccountPayable(id: string, updatedFields: Partial<Omit<AccountsPayable, 'id' | 'created_at'>>) {
    loading.value = true;
    error.value = null;
    try {
      const data = await api.put<AccountsPayable>(`/accounts-payable/${id}`, updatedFields);
      const index = accountsPayable.value.findIndex(acc => acc.id === id);
      if (index !== -1) {
        accountsPayable.value[index] = { ...accountsPayable.value[index], ...data };
      }
      return data;
    } catch (err: unknown) {
      console.error('Erro ao atualizar conta a pagar:', err);
      if (err instanceof Error) {
        error.value = err.message || 'Falha ao atualizar conta a pagar.';
      } else {
        error.value = 'Falha ao atualizar conta a pagar.';
      }
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteAccountPayable(id: string) {
    loading.value = true;
    error.value = null;
    try {
      await api.delete(`/accounts-payable/${id}`);
      accountsPayable.value = accountsPayable.value.filter(acc => acc.id !== id);
    } catch (err: unknown) {
      console.error('Erro ao deletar conta a pagar:', err);
      if (err instanceof Error) {
        error.value = err.message || 'Falha ao deletar conta a pagar.';
      } else {
        error.value = 'Falha ao deletar conta a pagar.';
      }
      throw err;
    } finally {
      loading.value = false;
    }
  }

  const getAccountsPayable = computed(() => accountsPayable.value);
  const getUnpaidAccounts = computed(() => accountsPayable.value.filter(acc => !acc.is_paid));
  const getPaidAccounts = computed(() => accountsPayable.value.filter(acc => acc.is_paid));

  return {
    accountsPayable,
    loading,
    error,
    fetchAccountsPayable,
    addAccountPayable,
    updateAccountPayable,
    deleteAccountPayable,
    getAccountsPayable,
    getUnpaidAccounts,
    getPaidAccounts,
  };
});
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Account } from '@/types/index';

export const useAccountStore = defineStore('accountStore', () => {
  const accounts = ref<Account[]>([]);

  async function fetchAccounts() {
    try {
      const response = await fetch('/api/accounts');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: Account[] = await response.json();
      accounts.value = data;
    } catch (error) {
      console.error("Erro ao buscar contas:", error);
    }
  }

  const getAllAccounts = computed(() => accounts.value);

  const getAccountById = computed(() => (id: string) => {
    return accounts.value.find(account => account.id === id);
  });

  const getAccountByName = computed(() => (name: string) => {
    return accounts.value.find(account => account.name === name);
  });

  // NEW: Computed property to get unique account types
  const accountTypes = computed(() => {
    const types = new Set<string>();
    accounts.value.forEach(account => types.add(account.type));
    return Array.from(types);
  });

  // NEW: Getter to get accounts filtered by type
  const getAccountsByType = computed(() => (type: string) => {
    return accounts.value.filter(account => account.type === type);
  });

  async function addAccount(account: Account) {
    try {
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(account),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const newAccount: Account = await response.json();
      accounts.value.push(newAccount);
    } catch (error) {
      console.error("Erro ao adicionar conta:", error);
    }
  }

  async function updateAccount(id: string, updatedFields: Partial<Account>) {
    try {
      const response = await fetch(`/api/accounts?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedFields),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const updatedAccount: Account = await response.json();
      const index = accounts.value.findIndex(acc => acc.id === id);
      if (index !== -1) {
        accounts.value[index] = updatedAccount;
      }
    } catch (error) {
      console.error("Erro ao atualizar conta:", error);
    }
  }

  async function deleteAccount(id: string) {
    try {
      const response = await fetch(`/api/accounts?id=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      accounts.value = accounts.value.filter(acc => acc.id !== id);
    } catch (error) {
      console.error("Erro ao deletar conta:", error);
    }
  }

  return {
    accounts,
    getAllAccounts,
    getAccountById,
    getAccountByName,
    accountTypes,
    getAccountsByType,
    fetchAccounts,
    addAccount,
    updateAccount,
    deleteAccount,
  };
});
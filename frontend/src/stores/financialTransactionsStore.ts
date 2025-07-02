import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@/services/api';

interface FinancialTransaction {
  id: string;
  description: string;
  amount: number;
  due_date: string;
  paid_date?: string | null;
  received_date?: string | null;
  is_paid?: boolean;
  is_received?: boolean;
  created_at: string;
}

export const useFinancialTransactionsStore = defineStore('financialTransactions', () => {
  const payables = ref<FinancialTransaction[]>([]);
  const receivables = ref<FinancialTransaction[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchFinancialTransactions() {
    loading.value = true;
    error.value = null;
    try {
      const payableData = await api.get<FinancialTransaction[]>('/financial-transactions', { params: { type: 'payable' } });
      payables.value = payableData;

      const receivableData = await api.get<FinancialTransaction[]>('/financial-transactions', { params: { type: 'receivable' } });
      receivables.value = receivableData;

    } catch (err: unknown) {
      console.error('Erro ao buscar transações financeiras:', err);
      if (err instanceof Error) {
        error.value = err.message || 'Falha ao buscar transações financeiras.';
      } else {
        error.value = 'Falha ao buscar transações financeiras.';
      }
    } finally {
      loading.value = false;
    }
  }

  async function addFinancialTransaction(type: 'payable' | 'receivable', newTransaction: Omit<FinancialTransaction, 'id' | 'created_at' | 'is_paid' | 'is_received'>) {
    loading.value = true;
    error.value = null;
    try {
      const data = await api.post<FinancialTransaction, typeof newTransaction & { type: string }>('/financial-transactions', { ...newTransaction, type });
      if (type === 'payable') {
        payables.value.push(data);
      } else {
        receivables.value.push(data);
      }
      return data;
    } catch (err: unknown) {
      console.error(`Erro ao adicionar transação ${type}:`, err);
      if (err instanceof Error) {
        error.value = err.message || `Falha ao adicionar transação ${type}.`;
      } else {
        error.value = `Falha ao adicionar transação ${type}.`;
      }
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateFinancialTransaction(type: 'payable' | 'receivable', id: string, updatedFields: Partial<Omit<FinancialTransaction, 'id' | 'created_at'>>) {
    loading.value = true;
    error.value = null;
    try {
      const data = await api.put<FinancialTransaction, Partial<Omit<FinancialTransaction, 'id' | 'created_at'>> & { type: string }>(`/financial-transactions/${id}`, { ...updatedFields, type });
      if (type === 'payable') {
        const index = payables.value.findIndex(t => t.id === id);
        if (index !== -1) {
          payables.value[index] = { ...payables.value[index], ...data };
        }
      } else {
        const index = receivables.value.findIndex(t => t.id === id);
        if (index !== -1) {
          receivables.value[index] = { ...receivables.value[index], ...data };
        }
      }
      return data;
    } catch (err: unknown) {
      console.error(`Erro ao atualizar transação ${type}:`, err);
      if (err instanceof Error) {
        error.value = err.message || `Falha ao atualizar transação ${type}.`;
      } else {
        error.value = `Falha ao atualizar transação ${type}.`;
      }
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteFinancialTransaction(type: 'payable' | 'receivable', id: string) {
    loading.value = true;
    error.value = null;
    try {
      await api.delete(`/financial-transactions/${id}`, { params: { type } });
      if (type === 'payable') {
        payables.value = payables.value.filter(t => t.id !== id);
      } else {
        receivables.value = receivables.value.filter(t => t.id !== id);
      }
    } catch (err: unknown) {
      console.error(`Erro ao deletar transação ${type}:`, err);
      if (err instanceof Error) {
        error.value = err.message || `Falha ao deletar transação ${type}.`;
      } else {
        error.value = `Falha ao deletar transação ${type}.`;
      }
      throw err;
    } finally {
      loading.value = false;
    }
  }

  const getUnpaidAccounts = computed(() => payables.value.filter(acc => !acc.is_paid));
  const getPaidAccounts = computed(() => payables.value.filter(acc => acc.is_paid));
  const getUnreceivedAccounts = computed(() => receivables.value.filter(acc => !acc.is_received));
  const getReceivedAccounts = computed(() => receivables.value.filter(acc => acc.is_received));

  return {
    payables,
    receivables,
    loading,
    error,
    fetchFinancialTransactions,
    addFinancialTransaction,
    updateFinancialTransaction,
    deleteFinancialTransaction,
    getUnpaidAccounts,
    getPaidAccounts,
    getUnreceivedAccounts,
    getReceivedAccounts,
  };
});
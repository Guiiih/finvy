import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Account } from '@/types/index';

export const useAccountStore = defineStore('accountStore', () => {
  const accounts = ref<Account[]>([
    { id: '1', name: 'Capital Social Subscrito', type: 'equity', nature: 'credit' },
    { id: '2', name: 'Capital Social a Integralizar', type: 'equity', nature: 'debit' },
    { id: '3', name: 'Caixa Econômica Federal', type: 'asset', nature: 'debit' },
    { id: '4', name: 'Móveis e Utensílios', type: 'asset', nature: 'debit' },
    { id: '5', name: 'Compras de Mercadoria', type: 'expense', nature: 'debit' }, // Alterado para expense, pois é uma conta de resultado que compõe o CMV
    { id: '6', name: 'Fornecedores', type: 'liability', nature: 'credit' },
    { id: '7', name: 'Caixa', type: 'asset', nature: 'debit' },
    { id: '8', name: 'Banco Itaú', type: 'asset', nature: 'debit' },
    { id: '9', name: 'Banco Bradesco', type: 'asset', nature: 'debit' },
    { id: '10', name: 'Receita de Vendas', type: 'revenue', nature: 'credit' },
    { id: '11', name: 'Clientes', type: 'asset', nature: 'debit' },
    { id: '12', name: 'ICMS sobre Compras', type: 'asset', nature: 'debit' }, // ICMS a recuperar
    { id: '13', name: 'ICMS sobre Vendas', type: 'expense', nature: 'debit' }, // Dedução de Receita
    { id: '14', name: 'C/C ICMS', type: 'asset', nature: 'debit' }, // Conta transitória para apuração de ICMS
    { id: '15', name: 'CMV', type: 'expense', nature: 'debit' }, // Custo da Mercadoria Vendida - Pode ser usada para lançamentos diretos ou apuração
    { id: '17', 'name': 'Resultado Bruto', type: 'revenue', nature: 'credit' }, // Conta de apuração
    { id: '18', name: 'Reserva de Lucro', type: 'equity', nature: 'credit' },
    { id: '19', name: 'Salários a Pagar', type: 'liability', nature: 'credit' },
    { id: '20', name: 'Despesas com Salários', type: 'expense', nature: 'debit' },
    { id: '21', name: 'Impostos a Pagar', type: 'liability', nature: 'credit' },
    { id: '22', name: 'ICMS Antecipado', type: 'asset', nature: 'debit' },
    { id: '26', name: 'Estoque Final', type: 'asset', nature: 'debit' }, // Conta para o estoque final (ativo)
  ]);

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

  // NEW: action to add an account (useful for initial setup examples)
  function addAccount(account: Account) {
    accounts.value.push(account);
  }

  // NEW: action to reset the store (useful for development)
  function $reset() {
    // Reset accounts to their initial state or clear them
    accounts.value = [
      { id: '1', name: 'Capital Social Subscrito', type: 'equity', nature: 'credit' },
      { id: '2', name: 'Capital Social a Integralizar', type: 'equity', nature: 'debit' },
      { id: '3', name: 'Caixa Econômica Federal', type: 'asset', nature: 'debit' },
      { id: '4', name: 'Móveis e Utensílios', type: 'asset', nature: 'debit' },
      { id: '5', name: 'Compras de Mercadoria', type: 'asset', nature: 'debit' },
      { id: '6', name: 'Fornecedores', type: 'liability', nature: 'credit' },
      { id: '7', name: 'Caixa', type: 'asset', nature: 'debit' },
      { id: '8', name: 'Banco Itaú', type: 'asset', nature: 'debit' },
      { id: '9', name: 'Banco Bradesco', type: 'asset', nature: 'debit' },
      { id: '10', name: 'Receita de Vendas', type: 'revenue', nature: 'credit' },
      { id: '11', name: 'Clientes', type: 'asset', nature: 'debit' },
      { id: '12', name: 'ICMS sobre Compras', type: 'asset', nature: 'debit' },
      { id: '13', name: 'ICMS sobre Vendas', type: 'expense', nature: 'debit' },
      { id: '14', name: 'C/C ICMS', type: 'asset', nature: 'debit' },
      { id: '15', name: 'CMV', type: 'expense', nature: 'debit' },
      { id: '17', 'name': 'Resultado Bruto', type: 'revenue', nature: 'credit' },
      { id: '18', name: 'Reserva de Lucro', type: 'equity', nature: 'credit' },
      { id: '19', name: 'Salários a Pagar', type: 'liability', nature: 'credit' },
      { id: '20', name: 'Despesas com Salários', type: 'expense', nature: 'debit' },
      { id: '21', name: 'Impostos a Pagar', type: 'liability', nature: 'credit' },
      { id: '22', name: 'ICMS Antecipado', type: 'asset', nature: 'debit' },
      { id: '26', name: 'Estoque Final', type: 'asset', nature: 'debit' },
    ];
  }


  return { 
    accounts, 
    getAllAccounts, 
    getAccountById, 
    getAccountByName, 
    accountTypes, // Expose the new computed property
    getAccountsByType, // Expose the new getter
    addAccount, // Expose addAccount action
    $reset // Expose the reset function
  };
});
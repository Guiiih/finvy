// frontend/src/stores/accountStore.ts
import { defineStore } from 'pinia'
import type { Account } from '../types/index' 

export const useAccountStore = defineStore('accounts', {
  state: () => ({
    accounts: [
      { id: '1', name: 'Caixa Econômica Federal', type: 'asset', nature: 'debit' }, 
      { id: '2', name: 'Móveis e Utensílios', type: 'asset', nature: 'debit' }, 
      { id: '3', name: 'Capital Social a Integralizar', type: 'equity', nature: 'debit' }, 
      { id: '4', name: 'Capital Social Subscrito', type: 'equity', nature: 'credit' }, 

      { id: '5', name: 'Caixa', type: 'asset', nature: 'debit' }, 
      { id: '6', name: 'Banco Itaú', type: 'asset', nature: 'debit' }, 
      { id: '7', name: 'Banco Bradesco', type: 'asset', nature: 'debit' }, 
      { id: '8', name: 'Fornecedores', type: 'liability', nature: 'credit' }, 
      { id: '9', name: 'Clientes', type: 'asset', nature: 'debit' }, 
      { id: '10', name: 'Compras de Mercadoria', type: 'asset', nature: 'debit' }, 
      { id: '12', name: 'ICMS sobre Vendas', type: 'revenue', nature: 'debit' }, // ALTERADO: natureza para 'debit'
      { id: '13', name: 'Receita de Vendas', type: 'revenue', nature: 'credit' }, 
      { id: '14', name: 'CMV', type: 'expense', nature: 'debit' }, 
      { id: '15', name: 'Salários a Pagar', type: 'liability', nature: 'credit' }, 
      { id: '16', name: 'Despesas com Salários', type: 'expense', nature: 'debit' }, 
      { id: '17', name: 'ICMS sobre Compras', type: 'asset', nature: 'debit' }, 
      { id: '18', name: 'Custo da Mercadoria Vendida', type: 'expense', nature: 'debit' },
      { id: '19', name: 'Reserva de Lucro', type: 'equity', nature: 'credit' }, 
      { id: '20', name: 'Impostos a Pagar', type: 'liability', nature: 'credit' }, 
      { id: '21', name: 'ICMS Antecipado', type: 'asset', nature: 'debit' },
      { id: '22', name: 'Resultado Bruto', type: 'equity', nature: 'credit' },
      { id: '23', name: 'C/C ICMS', type: 'liability', nature: 'credit' } 
    ] as Account[]
  }),
  getters: {
    getAllAccounts(state) {
      return state.accounts;
    },
    getAccountById: (state) => (id: string) => {
      return state.accounts.find(account => account.id === id);
    },
    getAccountByName: (state) => (name: string) => {
      return state.accounts.find(account => account.name === name);
    }
  },
  actions: {
  }
})
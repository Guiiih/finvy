// frontend/src/stores/accountStore.ts
import { defineStore } from 'pinia'
import type { Account } from '@/types'

export const useAccountStore = defineStore('accounts', {
  state: () => ({
    accounts: [
      { id: '1', name: 'Caixa Econômica Federal', type: 'asset', nature: 'debit' },
      { id: '2', name: 'Móveis e Utensílios', type: 'asset', nature: 'debit' },
      { id: '3', name: 'Capital Social a Integralizar', type: 'equity', nature: 'debit' },
      { id: '4', name: 'Capital Social Subscrito', type: 'equity', nature: 'credit' }
    ] as Account[]
  }),
  getters: {
    // Futuramente podemos ter getters para saldos, etc.
  },
  actions: {
    // Futuramente teremos ações para adicionar novas contas.
  }
})
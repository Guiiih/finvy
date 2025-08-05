import { defineStore } from 'pinia'
import { useJournalEntryStore } from './journalEntryStore'

import type { JournalEntry, EntryLine } from '@/types/index'

export const useTransactionStore = defineStore('transactionStore', () => {
  const journalEntryStore = useJournalEntryStore()
  

  async function recordSale(saleDetails: {
    productId: string
    quantity: number
    salePrice: number
    customerAccountId: string
    revenueAccountId: string
    cogsAccountId: string
    inventoryAccountId: string
    date: string
    description: string
  }) {
    try {
      const {
        quantity,
        salePrice,
        customerAccountId,
        revenueAccountId,
        date,
        description,
      } = saleDetails

      const journalEntryLines: EntryLine[] = [
        {
          account_id: customerAccountId,
          type: 'debit',
          debit: quantity * salePrice,
          credit: 0,
          amount: quantity * salePrice,
        },
        {
          account_id: revenueAccountId,
          type: 'credit',
          debit: 0,
          credit: quantity * salePrice,
          amount: quantity * salePrice,
        },
      ]

      const newJournalEntry: JournalEntry = {
        id: '',
        entry_date: date,
        description: description,
        reference: '', // Adicionado campo de referência
        lines: journalEntryLines,
      }

      await journalEntryStore.addJournalEntry(newJournalEntry)

      console.log('Venda registrada com sucesso!')
    } catch (err: unknown) {
      console.error('Erro ao registrar venda:', err)
      if (err instanceof Error) {
        throw err
      } else {
        throw new Error('Erro desconhecido ao registrar venda.')
      }
    }
  }

  return {
    recordSale,
  }
})
import { defineStore } from 'pinia';
import { useJournalEntryStore } from './journalEntryStore';
import { useProductStore } from './productStore';
import type { JournalEntry, EntryLine } from '@/types/index';

export const useTransactionStore = defineStore('transactionStore', () => {
  const journalEntryStore = useJournalEntryStore();
  const productStore = useProductStore();

  async function recordSale(saleDetails: {
    productId: string;
    quantity: number;
    salePrice: number;
    customerAccountId: string;
    revenueAccountId: string;
    cogsAccountId: string;
    inventoryAccountId: string;
    date: string;
    description: string;
  }) {
    try {
      const { productId, quantity, salePrice, customerAccountId, revenueAccountId, cogsAccountId, inventoryAccountId, date, description } = saleDetails;

      const product = productStore.getProductById(productId);
      if (!product) {
        throw new Error(`Produto com ID ${productId} não encontrado.`);
      }
      const costOfGoods = product.unit_cost;

      const journalEntryLines: EntryLine[] = [
        { account_id: customerAccountId, type: 'debit', debit: quantity * salePrice, credit: 0, amount: quantity * salePrice },
        { account_id: revenueAccountId, type: 'credit', debit: 0, credit: quantity * salePrice, amount: quantity * salePrice },
        { account_id: cogsAccountId, type: 'debit', debit: quantity * costOfGoods, credit: 0, amount: quantity * costOfGoods },
        { account_id: inventoryAccountId, type: 'credit', debit: 0, credit: quantity * costOfGoods, amount: quantity * costOfGoods, product_id: productId, quantity: quantity, unit_cost: costOfGoods },
      ];

      const newJournalEntry: JournalEntry = {
        id: '',
        entry_date: date,
        description: description,
        lines: journalEntryLines,
      };

      await journalEntryStore.addJournalEntry(newJournalEntry);

      await productStore.updateProduct(productId, { current_stock: (product.current_stock || 0) - quantity });

      console.log('Venda registrada com sucesso!');
    } catch (error: unknown) { 
      console.error('Erro ao registrar venda:', error);
      if (error instanceof Error) {
        throw error; 
      } else {
        throw new Error('Erro desconhecido ao registrar venda.');
      }
    }
  }

  return {
    recordSale,
  };
});
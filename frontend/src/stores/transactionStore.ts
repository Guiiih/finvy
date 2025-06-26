import { defineStore } from 'pinia';
import { useJournalEntryStore } from './journalEntryStore';
import { useProductStore } from './productStore';
import type { JournalEntry, EntryLine } from '@/types/index';

export const useTransactionStore = defineStore('transactionStore', () => {
  const journalEntryStore = useJournalEntryStore();
  const productStore = useProductStore();

  /**
   * Registra uma transação de venda, criando lançamentos contábeis e atualizando o estoque.
   * @param saleDetails Detalhes da venda, incluindo produto, quantidade, preço de venda, etc.
   */
  async function recordSale(saleDetails: {
    productId: string;
    quantity: number;
    salePrice: number;
    customerAccountId: string; // Ex: Conta de Clientes ou Caixa/Banco
    revenueAccountId: string; // Ex: Receita de Vendas
    cogsAccountId: string; // Ex: Custo da Mercadoria Vendida (CMV)
    inventoryAccountId: string; // Ex: Estoques
    date: string;
    description: string;
  }) {
    try {
      const { productId, quantity, salePrice, customerAccountId, revenueAccountId, cogsAccountId, inventoryAccountId, date, description } = saleDetails;

      // 1. Buscar o produto para obter o custo unitário atual do estoque
      const product = productStore.getProductById(productId);
      if (!product) {
        throw new Error(`Produto com ID ${productId} não encontrado.`);
      }
      // Assumindo que o productStore já tem o custo médio ou que ele será calculado no backend/stockControlStore
      // Por enquanto, usaremos um custo fictício ou o unitPrice do produto se disponível
      const costOfGoods = product.unitPrice; // Usando unitPrice do produto como custo para o CMV

      // 2. Criar as linhas de lançamento para a venda
      const journalEntryLines: EntryLine[] = [
        // Lançamento da Receita de Venda
        { accountId: customerAccountId, debit: quantity * salePrice, credit: 0, amount: quantity * salePrice }, // Débito: Clientes/Caixa
        { accountId: revenueAccountId, debit: 0, credit: quantity * salePrice, amount: quantity * salePrice }, // Crédito: Receita de Vendas

        // Lançamento do Custo da Mercadoria Vendida (CMV)
        { accountId: cogsAccountId, debit: quantity * costOfGoods, credit: 0, amount: quantity * costOfGoods }, // Débito: CMV
        { accountId: inventoryAccountId, debit: 0, credit: quantity * costOfGoods, amount: quantity * costOfGoods, productId: productId, quantity: quantity, unitCost: costOfGoods }, // Crédito: Estoques (com detalhes do produto para controle de estoque)
      ];

      const newJournalEntry: JournalEntry = {
        id: '', // O ID será gerado pelo backend
        date: date,
        description: description,
        lines: journalEntryLines,
        user_id: '', // Defina o user_id apropriado aqui
      };

      // 3. Adicionar o lançamento contábil
      await journalEntryStore.addJournalEntry(newJournalEntry);

      // 4. Atualizar a quantidade do produto no estoque (se o productStore gerenciar isso diretamente)
      // Nota: Em um sistema mais robusto, a atualização do estoque pode ser um gatilho no banco de dados
      // ou gerenciada exclusivamente pelo stockControlStore com base nos lançamentos.
      // Aqui, estamos fazendo uma atualização direta no productStore para fins de demonstração.
      await productStore.updateProduct(productId, { current_stock: product.quantity - quantity });

      console.log('Venda registrada com sucesso!');
    } catch (error) {
      console.error('Erro ao registrar venda:', error);
      throw error; // Re-lança o erro para que o componente possa tratá-lo
    }
  }

  return {
    recordSale,
  };
});

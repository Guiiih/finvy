import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import type { StockMovement, Product } from '@/types/index';
import { useJournalEntryStore } from './journalEntryStore';
import { useProductStore } from './productStore';

interface ProductBalance {
  productId: string;
  quantity: number;
  unitCost: number; // custo médio
  totalValue: number;
}

export const useStockControlStore = defineStore('stockControlStore', () => {
  const journalEntryStore = useJournalEntryStore();
  const productStore = useProductStore();

  const movements = ref<StockMovement[]>([]);
  const balances = ref<ProductBalance[]>([]);

  // Getter para todos os movimentos
  const getAllMovements = computed(() => movements.value);

  // Getter para o balanço de um produto específico
  const getBalanceByProductId = computed(() => (productId: string) => {
    return balances.value.find(balance => balance.productId === productId);
  });

  // Função para recalcular o estoque com base nos lançamentos contábeis
  function recalculateStock() {
    movements.value = [];
    balances.value = [];

    const tempBalances: { [productId: string]: ProductBalance } = {};

    // Coletar todos os movimentos de estoque dos lançamentos
    const rawStockMovements: StockMovement[] = [];
    journalEntryStore.journalEntries.forEach(entry => {
      entry.lines.forEach(line => {
        if (line.productId && line.quantity && line.unitCost) {
          // Determinar o tipo de movimento (compra/venda) com base na conta e no débito/crédito
          // Esta lógica pode precisar ser mais sofisticada dependendo das contas usadas
          // Por exemplo, se a conta de estoque é debitada (entrada) ou creditada (saída)
          // Por simplicidade, vamos assumir que um débito na conta de estoque é uma entrada
          // e um crédito é uma saída, ou que o tipo é inferido de outras formas.
          // Para este exemplo, vamos inferir 'in' se for um débito e 'out' se for um crédito
          // na conta de estoque, ou se for uma linha de produto com quantidade e custo.

          // Para o propósito de controle de estoque, vamos considerar que:
          // - Débito em conta de estoque (e crédito em fornecedor/caixa) é uma compra (IN)
          // - Crédito em conta de estoque (e débito em CMV/cliente) é uma venda (OUT)

          // Simplificando para o exemplo: se a linha tem productId, quantity e unitCost,
          // e é um débito, é uma entrada. Se é um crédito, é uma saída.
          const type: 'in' | 'out' = (line.debit && line.debit > 0) ? 'in' : 'out';

          rawStockMovements.push({
            id: `${entry.id}-${line.accountId}-${line.productId}`,
            journalEntryId: entry.id,
            date: entry.date,
            type: type,
            productId: line.productId,
            quantity: line.quantity,
            unitPrice: line.unitCost,
            totalValue: line.quantity * line.unitCost,
          });
        }
      });
    });

    // Ordenar movimentos por data para calcular o custo médio corretamente
    rawStockMovements.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    rawStockMovements.forEach(newMovement => {
      let currentBalance = tempBalances[newMovement.productId] || { productId: newMovement.productId, quantity: 0, unitCost: 0, totalValue: 0 };

      let newQuantity = currentBalance.quantity;
      let newTotalValue = currentBalance.totalValue;
      let newUnitCost = currentBalance.unitCost;

      if (newMovement.type === 'in') {
        newQuantity += newMovement.quantity;
        newTotalValue += newMovement.totalValue;
        newUnitCost = newTotalValue / newQuantity; // Recalcula custo médio
      } else if (newMovement.type === 'out') {
        if (newMovement.quantity > newQuantity) {
          console.warn(`Tentativa de vender mais do que o estoque disponível para ${newMovement.productId}. Ajustando quantidade.`);
          newMovement.quantity = newQuantity; // Ajusta para a quantidade máxima disponível
          newMovement.totalValue = newMovement.quantity * currentBalance.unitCost; // Ajusta o valor total
        }

        const costOfGoodsSold = newMovement.quantity * currentBalance.unitCost; // CMV da operação

        newQuantity -= newMovement.quantity;
        newTotalValue -= costOfGoodsSold; // Reduz o valor total do estoque pelo CMV

        if (newQuantity <= 0) {
          newUnitCost = 0;
          newTotalValue = 0;
        } else {
          newUnitCost = newTotalValue / newQuantity; // Recalcula custo médio
        }
      }

      tempBalances[newMovement.productId] = {
        productId: newMovement.productId,
        quantity: newQuantity,
        unitCost: newUnitCost,
        totalValue: newTotalValue,
      };
      movements.value.push(newMovement);
    });

    balances.value = Object.values(tempBalances);
  }

  // Observar mudanças nos lançamentos contábeis para recalcular o estoque
  watch(() => journalEntryStore.journalEntries, () => {
    recalculateStock();
  }, { deep: true, immediate: true });

  // NEW: Getter para calcular o CMV total
  const totalCostOfGoodsSold = computed(() => {
    return movements.value
      .filter(m => m.type === 'out')
      .reduce((sum, m) => sum + m.totalValue, 0);
  });

  // NEW: Getter para o valor do Estoque Final
  const finalInventoryValue = computed(() => (productId: string) => {
    const balance = balances.value.find(b => b.productId === productId);
    return balance ? balance.totalValue : 0;
  });

  return {
    movements,
    balances,
    getAllMovements,
    getBalanceByProductId,
    totalCostOfGoodsSold,
    finalInventoryValue,
    recalculateStock, // Expor para chamadas manuais se necessário
  };
});

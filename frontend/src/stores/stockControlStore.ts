// frontend/src/stores/stockControlStore.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { StockMovement } from '@/types/index';

interface ProductBalance {
  productId: string;
  quantity: number;
  unitCost: number; // custo médio
  totalValue: number;
}

export const useStockControlStore = defineStore('stockControlStore', () => {
  const movements = ref<StockMovement[]>([]);
  const balances = ref<ProductBalance[]>([]);

  // Getter para todos os movimentos
  const getAllMovements = computed(() => movements.value);

  // Getter para o balanço de um produto específico
  const getBalanceByProductId = computed(() => (productId: string) => {
    return balances.value.find(balance => balance.productId === productId);
  });

  // Ação para adicionar um movimento e atualizar o balanço
  function addMovement(newMovement: StockMovement) {
    const existingBalanceIndex = balances.value.findIndex(b => b.productId === newMovement.productId);
    let currentBalance: ProductBalance = { productId: newMovement.productId, quantity: 0, unitCost: 0, totalValue: 0 };

    if (existingBalanceIndex !== -1) {
      currentBalance = balances.value[existingBalanceIndex];
    }

    let newQuantity = currentBalance.quantity;
    let newTotalValue = currentBalance.totalValue;
    let newUnitCost = currentBalance.unitCost;

    if (newMovement.type === 'in') {
      // Compra
      newQuantity += newMovement.quantity;
      newTotalValue += newMovement.totalValue;
      newUnitCost = newTotalValue / newQuantity; // Recalcula custo médio
    } else if (newMovement.type === 'out') {
      // Venda (baixa pelo custo médio atual)
      if (newMovement.quantity > newQuantity) {
        console.warn(`Tentativa de vender mais do que o estoque disponível para ${newMovement.productId}. Ajustando quantidade.`);
        newMovement.quantity = newQuantity; // Ajusta para a quantidade máxima disponível
        newMovement.totalValue = newMovement.quantity * currentBalance.unitCost; // Ajusta o valor total
      }
      
      const costOfGoodsSold = newMovement.quantity * currentBalance.unitCost; // CMV da operação
      
      newQuantity -= newMovement.quantity;
      newTotalValue -= costOfGoodsSold; // Reduz o valor total do estoque pelo CMV
      
      // Se a quantidade for zero, zera o custo médio para evitar NaN ou divisões por zero futuras
      if (newQuantity <= 0) {
         newUnitCost = 0;
         newTotalValue = 0; // Garante que o total também seja 0
      } else {
         newUnitCost = newTotalValue / newQuantity; // Recalcula custo médio
      }
      
      // Armazena o CMV para uso futuro (por exemplo, em um getter)
      // Para simplificar, o CMV é o totalValue do movimento 'out'
    }

    if (existingBalanceIndex !== -1) {
      balances.value[existingBalanceIndex] = {
        productId: newMovement.productId,
        quantity: newQuantity,
        unitCost: newUnitCost,
        totalValue: newTotalValue,
      };
    } else {
      balances.value.push({
        productId: newMovement.productId,
        quantity: newQuantity,
        unitCost: newUnitCost,
        totalValue: newTotalValue,
      });
    }
    movements.value.push(newMovement);
  }

  // Ação para resetar os movimentos e balanços
  function resetMovements() {
    movements.value = [];
  }

  function resetBalances() {
    balances.value = [];
  }

  function $reset() {
    movements.value = [];
    balances.value = [];
  }

  // NEW: Getter para calcular o CMV total
  const totalCostOfGoodsSold = computed(() => {
    return movements.value
      .filter(m => m.type === 'out')
      .reduce((sum, m) => sum + m.totalValue, 0); // O totalValue do movimento 'out' já é o CMV daquele movimento
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
    addMovement,
    resetMovements,
    resetBalances,
    $reset,
    totalCostOfGoodsSold, // Expor o CMV total
    finalInventoryValue // Expor o Estoque Final por produto
  };
});
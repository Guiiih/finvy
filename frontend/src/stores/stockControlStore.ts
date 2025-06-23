// frontend/src/stores/stockControlStore.ts
import { defineStore } from 'pinia';
import type { StockMovement, StockBalance } from '../types/index'; // Importe StockBalance também

interface StockControlState {
  movements: StockMovement[];
  balances: StockBalance[]; 
}

export const useStockControlStore = defineStore('stockControl', {
  state: (): StockControlState => ({
    movements: [],
    balances: [],
  }),
  actions: {
    addMovement(movement: StockMovement) { // Recebe StockMovement com unitPrice
      this.movements.push(movement);
      this.updateBalance(movement);
    },

    updateBalance(newMovement: StockMovement) {
      let currentBalance = this.balances.find(b => b.productId === newMovement.productId);

      if (!currentBalance) {
        currentBalance = {
          productId: newMovement.productId,
          quantity: 0,
          unitCost: 0, // unitCost para o balanço interno
          totalValue: 0,
        };
        this.balances.push(currentBalance);
      }

      if (newMovement.type === 'purchase' || newMovement.type === 'in') { // A compra/entrada usa o unitPrice do movimento
        const newTotalQuantity = currentBalance.quantity + newMovement.quantity;
        const newTotalValue = currentBalance.totalValue + (newMovement.quantity * newMovement.unitPrice); // Multiplica quantidade pelo unitPrice
        currentBalance.quantity = newTotalQuantity;
        currentBalance.totalValue = newTotalValue;
        currentBalance.unitCost = newTotalValue / newTotalQuantity; 
      } else { // type === 'sale' || type === 'out'
        // Para venda/saída, o custo unitário vem do custo médio atual do estoque
        newMovement.totalValue = newMovement.quantity * currentBalance.unitCost; // Calcula o CMV com base no custo médio do estoque
        newMovement.unitPrice = currentBalance.unitCost; // Define o unitPrice do movimento de saída como o custo médio

        currentBalance.quantity -= newMovement.quantity;
        currentBalance.totalValue -= newMovement.totalValue; // Subtrai o CMV

        if (currentBalance.quantity < 0) {
          console.warn(`Venda excedeu o estoque para o produto ${newMovement.productId}`);
          currentBalance.quantity = 0; 
        }
        if (currentBalance.quantity === 0) {
          currentBalance.unitCost = 0;
          currentBalance.totalValue = 0;
        }
      }
    },
  },
  getters: {
    getAllMovements(state) {
      return state.movements;
    },
    getAllBalances(state) {
      return state.balances;
    },
    getBalanceByProductId: (state) => (productId: string) => {
      return state.balances.find(b => b.productId === productId);
    },
    getMovementsByProductId: (state) => (productId: string) => {
        return state.movements.filter(m => m.productId === productId).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
  },
});
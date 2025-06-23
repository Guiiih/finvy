import { defineStore } from 'pinia';
import type { JournalEntry } from '@/types/index'; 

export interface StockMovement {
  id: string;
  journalEntryId?: string; 
  date: string;
  type: 'purchase' | 'sale'; 
  productId: string;
  quantity: number;
  unitCost: number; 
  totalValue: number;
}

export interface StockBalance {
  productId: string;
  quantity: number;
  unitCost: number; 
  totalValue: number;
}

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
    addMovement(movement: StockMovement) {
      this.movements.push(movement);
      this.updateBalance(movement);
    },

    updateBalance(newMovement: StockMovement) {
      let currentBalance = this.balances.find(b => b.productId === newMovement.productId);

      if (!currentBalance) {
        currentBalance = {
          productId: newMovement.productId,
          quantity: 0,
          unitCost: 0,
          totalValue: 0,
        };
        this.balances.push(currentBalance);
      }

      if (newMovement.type === 'purchase') {
        const newTotalQuantity = currentBalance.quantity + newMovement.quantity;
        const newTotalValue = currentBalance.totalValue + newMovement.totalValue;
        currentBalance.quantity = newTotalQuantity;
        currentBalance.totalValue = newTotalValue;
        currentBalance.unitCost = newTotalValue / newTotalQuantity; 
      } else { 
        newMovement.unitCost = currentBalance.unitCost; 
        newMovement.totalValue = newMovement.quantity * currentBalance.unitCost;

        currentBalance.quantity -= newMovement.quantity;
        currentBalance.totalValue -= newMovement.totalValue;

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
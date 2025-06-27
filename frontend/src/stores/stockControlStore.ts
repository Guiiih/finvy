import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import type { StockMovement, Product } from '@/types/index';
import { useProductStore } from './productStore';

interface ProductBalance {
  productId: string;
  productName: string;
  quantity: number;
  unit_cost: number;
  totalValue: number;
}

export const useStockControlStore = defineStore('stockControlStore', () => {
  const productStore = useProductStore();

  const movements = ref<StockMovement[]>([]); 
  const balances = computed<ProductBalance[]>(() => {
    return productStore.products.map(product => ({
      productId: product.id,
      productName: product.name,
      quantity: product.current_stock || 0,
      unit_cost: product.unit_cost || 0,
      totalValue: (product.current_stock || 0) * (product.unit_cost || 0)
    }));
  });

  const getAllMovements = computed(() => movements.value);

  const getBalanceByProductId = computed(() => (productId: string) => {
    return balances.value.find(balance => balance.productId === productId);
  });

  const totalCostOfGoodsSold = computed(() => {
    return 0; 
  });

  const finalInventoryValue = computed(() => (productId: string) => {
    const balance = balances.value.find(b => b.productId === productId);
    return balance ? balance.totalValue : 0;
  });

  return {
    balances,
    getBalanceByProductId,
    totalCostOfGoodsSold,
    finalInventoryValue,
  };
});
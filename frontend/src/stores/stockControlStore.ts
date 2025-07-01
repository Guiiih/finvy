import { defineStore } from 'pinia';
import { computed } from 'vue';
import { useReportStore } from './reportStore';

interface ProductBalance {
  productId: string;
  productName: string;
  quantity: number;
  unit_cost: number;
  totalValue: number;
}

export const useStockControlStore = defineStore('stockControlStore', () => {
  const reportStore = useReportStore();

  const balances = computed<ProductBalance[]>(() => reportStore.stockBalances);

  const getBalanceByProductId = computed(() => (productId: string) => {
    return balances.value.find(balance => balance.productId === productId);
  });

  const totalCostOfGoodsSold = computed(() => {
    // This will be calculated in the backend and provided via reportStore.dreData.cmv
    return reportStore.dreData.cmv;
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
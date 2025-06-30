import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useProductStore } from './productStore';
import { useJournalEntryStore } from './journalEntryStore'; // Import journalEntryStore

interface ProductBalance {
  productId: string;
  productName: string;
  quantity: number;
  unit_cost: number;
  totalValue: number;
}

interface StockMovement {
  id: string;
  productId: string;
  type: 'in' | 'out';
  quantity: number;
  unit_cost: number;
  date: string;
}

export const useStockControlStore = defineStore('stockControlStore', () => {
  const productStore = useProductStore();
  const journalEntryStore = useJournalEntryStore(); // Initialize journalEntryStore

  const movements = ref<StockMovement[]>([]); 
  const balances = computed<ProductBalance[]>(() => {
    const productBalancesMap = new Map<string, { quantity: number; totalCost: number }>();

    // Initialize with existing products, though entries will override/update
    productStore.products.forEach(product => {
      productBalancesMap.set(product.id, {
        quantity: 0, // Start from 0, as we'll build from entries
        totalCost: 0,
      });
    });

    journalEntryStore.getAllJournalEntries.forEach(entry => {
      entry.lines.forEach(line => {
        if (line.productId && line.quantity && line.unit_cost) {
          console.log('Processing line with product:', line.productId, 'Quantity:', line.quantity, 'Unit Cost:', line.unit_cost);
          const currentBalance = productBalancesMap.get(line.productId) || { quantity: 0, totalCost: 0 };

          if (line.debit && line.debit > 0) { // Purchase
            currentBalance.quantity += line.quantity;
            currentBalance.totalCost += line.quantity * line.unit_cost;
          } else if (line.credit && line.credit > 0) { // Sale
            // For sales, we need to use the average cost of goods sold
            // This is a simplification; a proper inventory system would use FIFO/LIFO/Weighted Average
            // For now, we'll just reduce quantity and total cost proportionally
            if (currentBalance.quantity > 0) {
              const averageUnitCost = currentBalance.totalCost / currentBalance.quantity;
              currentBalance.quantity -= line.quantity;
              currentBalance.totalCost -= line.quantity * averageUnitCost;
            }
          }
          productBalancesMap.set(line.productId, currentBalance);
        }
      });
    });

    return Array.from(productBalancesMap.entries()).map(([productId, data]) => {
      const product = productStore.getProductById(productId);
      const unit_cost = data.quantity > 0 ? data.totalCost / data.quantity : 0;
      return {
        productId: productId,
        productName: product?.name || 'Unknown Product',
        quantity: data.quantity,
        unit_cost: unit_cost,
        totalValue: data.totalCost,
      };
    }).filter(balance => balance.quantity > 0 || balance.totalValue > 0); // Filter out products with no stock/value
  });

  const getAllMovements = computed(() => movements.value);

  const getBalanceByProductId = computed(() => (productId: string) => {
    return balances.value.find(balance => balance.productId === productId);
  });

  const totalCostOfGoodsSold = computed(() => {
    // This would be more complex, tracking actual COGS from sales
    // For now, it's simplified or can be calculated in reportStore
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
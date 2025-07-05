import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useReportStore } from './reportStore'

interface ProductBalance {
  product_id: string
  productName: string
  quantity: number
  unit_cost: number
  totalValue: number
}

export const useStockControlStore = defineStore('stockControlStore', () => {
  const reportStore = useReportStore()

  const balances = computed<ProductBalance[]>(() => reportStore.stockBalances)

  const getBalanceByProductId = computed(() => (product_id: string) => {
    return balances.value.find((balance) => balance.product_id === product_id)
  })

  const totalCostOfGoodsSold = computed(() => {
    return reportStore.dreData.cmv
  })

  const finalInventoryValue = computed(() => (product_id: string) => {
    const balance = balances.value.find((b) => b.product_id === product_id)
    return balance ? balance.product_id : undefined
  })

  return {
    balances,
    getBalanceByProductId,
    totalCostOfGoodsSold,
    finalInventoryValue,
  }
})
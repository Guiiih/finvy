<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useStockControlStore } from '@/stores/stockControlStore'
import { useProductStore } from '@/stores/productStore'
import { useReportStore } from '@/stores/reportStore'

const stockControlStore = useStockControlStore()
const productStore = useProductStore()
const reportStore = useReportStore()

const startDate = ref('')
const endDate = ref('')

async function fetchStockData() {
  await reportStore.fetchReports(startDate.value, endDate.value)
}

onMounted(async () => {
  const today = new Date()
  endDate.value = today.toISOString().split('T')[0]
  startDate.value = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0]
  await fetchStockData()
})
</script>

<template>
  <div class="p-4 sm:p-6 max-w-7xl mx-auto">
    <h1 class="text-2xl font-bold mb-4 text-center text-surface-800">Controle de Estoque</h1>

    <div class="mb-6 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 p-4 bg-surface-50 rounded-lg shadow-md">
      <div class="flex flex-col sm:flex-row items-center gap-2">
        <label for="startDate" class="font-medium text-surface-700">Data Inicial:</label>
        <input type="date" id="startDate" v-model="startDate" @change="fetchStockData" class="p-2 border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400" />
      </div>
      <div class="flex flex-col sm:flex-row items-center gap-2">
        <label for="endDate" class="font-medium text-surface-700">Data Final:</label>
        <input type="date" id="endDate" v-model="endDate" @change="fetchStockData" class="p-2 border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400" />
      </div>
    </div>

    <p v-if="reportStore.loading" class="text-center p-4 bg-surface-100 border border-surface-200 rounded-lg text-surface-600 italic mt-4">Carregando dados de estoque...</p>
    <p v-else-if="reportStore.error" class="text-center p-4 bg-red-100 border border-red-200 rounded-lg text-red-700 mt-4">
      Erro ao carregar dados: {{ reportStore.error }}
    </p>
    <p v-else-if="stockControlStore.balances.length === 0" class="text-center p-4 bg-surface-100 border border-surface-200 rounded-lg text-surface-600 italic mt-4">
      Nenhum balanço de estoque para exibir. Adicione produtos e lançamentos contábeis.
    </p>
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="balance in stockControlStore.balances"
        :key="balance.product_id"
        class="bg-surface-50 p-6 rounded-lg shadow-md text-center"
      >
        <h3 class="text-xl font-semibold text-emerald-600 mb-3">
          {{ productStore.getProductById(balance.product_id)?.name || 'Produto Desconhecido' }}
        </h3>
        <p class="text-surface-700 mb-1">Quantidade: <span class="font-medium">{{ balance.quantity }}</span></p>
        <p class="text-surface-700 mb-1">Custo Unitário Médio: <span class="font-medium">R$ {{ balance.unit_cost.toFixed(2) }}</span></p>
        <p class="text-surface-800 text-lg font-bold mt-2">Valor Total: R$ {{ balance.totalValue.toFixed(2) }}</p>
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
import Card from 'primevue/card'
import Chart from 'primevue/chart'
import { ref, computed } from 'vue'
import { useReportStore } from '@/stores/reportStore'

const reportStore = useReportStore()

const incomeStatementData = computed(() => reportStore.incomeStatement)

// Função para formatar valores monetários
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

// Opções do gráfico
const chartOptions = ref({
  plugins: {
    legend: {
      position: 'bottom',
      labels: { usePointStyle: true },
    },
  },
})

// Dados computados para os gráficos
const revenueChartData = computed(() => ({
  labels: incomeStatementData.value?.revenueDetails.map((d) => `${d.name} (${d.percentage}%)`),
  datasets: [
    {
      data: incomeStatementData.value?.revenueDetails.map((d) => d.value),
      backgroundColor: ['#3B82F6', '#10B981', '#F97316'],
    },
  ],
}))

const expenseChartData = computed(() => ({
  labels: incomeStatementData.value?.expenseDetails.map((d) => `${d.name} (${d.percentage}%)`),
  datasets: [
    {
      data: incomeStatementData.value?.expenseDetails.map((d) => d.value),
      backgroundColor: ['#EF4444', '#F59E0B', '#8B5CF6', '#6366F1', '#14B8A6'],
    },
  ],
}))
</script>

<template>
  <div v-if="incomeStatementData" class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
    <Card class="text-center">
      <template #title>Receitas</template>
      <template #content>
        <p class="text-3xl font-bold text-green-500">
          {{ formatCurrency(incomeStatementData.summary.totalRevenue) }}
        </p>
        <div class="h-64 mt-4">
          <Chart type="pie" :data="revenueChartData" :options="chartOptions" />
        </div>
      </template>
    </Card>
    <Card class="text-center">
      <template #title>Despesas</template>
      <template #content>
        <p class="text-3xl font-bold text-red-500">
          {{ formatCurrency(incomeStatementData.summary.totalExpenses) }}
        </p>
        <div class="h-64 mt-4">
          <Chart type="pie" :data="expenseChartData" :options="chartOptions" />
        </div>
      </template>
    </Card>
    <Card class="text-center">
      <template #title>Resultado Líquido</template>
      <template #content>
        <p
          class="text-3xl font-bold"
          :class="incomeStatementData.summary.netIncome >= 0 ? 'text-green-500' : 'text-red-500'"
        >
          {{ formatCurrency(incomeStatementData.summary.netIncome) }}
        </p>
        <p class="text-surface-500 mt-2">
          Margem: {{ incomeStatementData.summary.margin.toFixed(1) }}%
        </p>
        <div class="mt-8 space-y-3 text-left">
          <div class="flex justify-between">
            <span>Receita Bruta</span>
            <span class="font-medium">{{
              formatCurrency(incomeStatementData.summary.totalRevenue)
            }}</span>
          </div>
          <div class="flex justify-between">
            <span>(-) Despesas</span>
            <span class="font-medium text-red-500">{{
              formatCurrency(incomeStatementData.summary.totalExpenses)
            }}</span>
          </div>
          <hr />
          <div class="flex justify-between font-bold text-lg">
            <span>Lucro Líquido</span>
            <span>{{ formatCurrency(incomeStatementData.summary.netIncome) }}</span>
          </div>
        </div>
      </template>
    </Card>
  </div>

  <div v-if="incomeStatementData" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <Card>
      <template #title>Detalhamento das Receitas</template>
      <template #content>
        <div class="space-y-3">
          <div
            v-for="item in incomeStatementData.revenueDetails"
            :key="item.name"
            class="flex justify-between"
          >
            <span
              >{{ item.name }}
              <span class="text-xs text-surface-400">{{ item.percentage }}% do total</span></span
            >
            <span class="font-medium">{{ formatCurrency(item.value) }}</span>
          </div>
        </div>
      </template>
    </Card>
    <Card>
      <template #title>Detalhamento das Despesas</template>
      <template #content>
        <div class="space-y-3">
          <div
            v-for="item in incomeStatementData.expenseDetails"
            :key="item.name"
            class="flex justify-between"
          >
            <span
              >{{ item.name }}
              <span class="text-xs text-surface-400">{{ item.percentage }}% do total</span></span
            >
            <span class="font-medium">{{ formatCurrency(item.value) }}</span>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

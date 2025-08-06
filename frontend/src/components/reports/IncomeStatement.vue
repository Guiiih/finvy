<script setup lang="ts">
import Card from 'primevue/card'
import Chart from 'primevue/chart'
import { ref, onMounted, reactive, computed } from 'vue'
// TODO: Importar o serviço da API para buscar os dados
// import { api } from '@/services/api';

const loading = ref(true)
const error = ref<string | null>(null)

// Estrutura de dados reativa para armazenar os dados da DRE
interface SummaryData {
  totalRevenue: number
  totalExpenses: number
  netIncome: number
  margin: number
}

interface DetailEntry {
  name: string
  value: number
  percentage: number
}

interface IncomeStatementReportData {
  summary: SummaryData
  revenueDetails: DetailEntry[]
  expenseDetails: DetailEntry[]
}

const incomeStatementData = reactive<IncomeStatementReportData>({
  summary: {
    totalRevenue: 0,
    totalExpenses: 0,
    netIncome: 0,
    margin: 0,
  },
  revenueDetails: [],
  expenseDetails: [],
})

// Função para formatar valores monetários
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

// TODO: Implementar a busca de dados reais da API
const fetchIncomeStatementData = async () => {
  loading.value = true
  error.value = null
  try {
    // const response = await api.get('/reports/income-statement', { params: { period: 'YYYY-MM' } });
    // Object.assign(incomeStatementData, response.data);
    // TODO: Remover esta simulação e descomentar a chamada real da API
    // await new Promise(resolve => setTimeout(resolve, 1000));
    // Object.assign(incomeStatementData, response.data);
  } catch (err) {
    error.value = 'Falha ao buscar os dados da DRE.'
    console.error(err)
  } finally {
    loading.value = false
  }
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
  labels: incomeStatementData.revenueDetails.map((d) => `${d.name} (${d.percentage}%)`),
  datasets: [
    {
      data: incomeStatementData.revenueDetails.map((d) => d.value),
      backgroundColor: ['#3B82F6', '#10B981', '#F97316'],
    },
  ],
}))

const expenseChartData = computed(() => ({
  labels: incomeStatementData.expenseDetails.map((d) => `${d.name} (${d.percentage}%)`),
  datasets: [
    {
      data: incomeStatementData.expenseDetails.map((d) => d.value),
      backgroundColor: ['#EF4444', '#F59E0B', '#8B5CF6', '#6366F1', '#14B8A6'],
    },
  ],
}))

// Buscar os dados quando o componente for montado
onMounted(fetchIncomeStatementData)
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
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

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

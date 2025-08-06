<script setup lang="ts">
import Card from 'primevue/card'
import Chart from 'primevue/chart'
import { ref, onMounted, reactive, computed } from 'vue'
// TODO: Importar o serviço da API para buscar os dados
// import { api } from '@/services/api';

const loading = ref(true)
const error = ref<string | null>(null)

// Estrutura de dados reativa para armazenar os dados do DFC
interface SummaryData {
  operational: number
  investment: number
  financing: number
  netCashFlow: number
}

interface DetailEntry {
  name: string
  value: number
}

interface DetailsData {
  operational: DetailEntry[]
  investment: DetailEntry[]
  financing: DetailEntry[]
}

interface EvolutionData {
  labels: string[]
  inflows: number[]
  outflows: number[]
  net: number[]
}

interface CashFlowReportData {
  summary: SummaryData
  details: DetailsData
  evolution: EvolutionData
}

const cashFlowData = reactive<CashFlowReportData>({
  summary: {
    operational: 0,
    investment: 0,
    financing: 0,
    netCashFlow: 0,
  },
  details: {
    operational: [],
    investment: [],
    financing: [],
  },
  evolution: {
    labels: [],
    inflows: [],
    outflows: [],
    net: [],
  },
})

// Função para formatar valores monetários
const formatCurrency = (value: number) => {
  const formatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    value,
  )
  return value < 0 ? `-${formatted.replace('-', '')}` : formatted
}

// TODO: Implementar a busca de dados reais da API
const fetchCashFlowData = async () => {
  loading.value = true
  error.value = null
  try {
    // const response = await api.get('/reports/cash-flow', { params: { period: 'YYYY-MM' } });
    // Object.assign(cashFlowData, response.data);
    // TODO: Remover esta simulação e descomentar a chamada real da API
    // await new Promise(resolve => setTimeout(resolve, 1000));
    // Object.assign(cashFlowData, response.data);
  } catch (err) {
    error.value = 'Falha ao buscar os dados do DFC.'
    console.error(err)
  } finally {
    loading.value = false
  }
}

// Propriedades computadas para totais e dados do gráfico
const totalOperational = computed(() =>
  cashFlowData.details.operational.reduce((sum, item) => sum + item.value, 0),
)
const totalInvestment = computed(() =>
  cashFlowData.details.investment.reduce((sum, item) => sum + item.value, 0),
)
const totalFinancing = computed(() =>
  cashFlowData.details.financing.reduce((sum, item) => sum + item.value, 0),
)

const evolutionChartData = computed(() => ({
  labels: cashFlowData.evolution.labels,
  datasets: [
    {
      label: 'Entradas',
      data: cashFlowData.evolution.inflows,
      borderColor: '#22C55E',
      backgroundColor: 'rgba(34, 197, 94, 0.2)',
      fill: true,
      tension: 0.4,
    },
    {
      label: 'Saídas',
      data: cashFlowData.evolution.outflows,
      borderColor: '#EF4444',
      backgroundColor: 'rgba(239, 68, 68, 0.2)',
      fill: true,
      tension: 0.4,
    },
    {
      label: 'Fluxo Líquido',
      data: cashFlowData.evolution.net,
      borderColor: '#3B82F6',
      fill: false,
      tension: 0.4,
    },
  ],
}))

const evolutionChartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'top' } },
  scales: { y: { ticks: { callback: (value: number) => `R$ ${value}K` } } },
})

// Buscar os dados quando o componente for montado
onMounted(fetchCashFlowData)
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
    <Card class="text-center">
      <template #title>Atividades Operacionais</template>
      <template #content>
        <p
          class="text-2xl font-bold"
          :class="cashFlowData.summary.operational >= 0 ? 'text-green-500' : 'text-red-500'"
        >
          {{ formatCurrency(cashFlowData.summary.operational) }}
        </p>
      </template>
    </Card>
    <Card class="text-center">
      <template #title>Atividades de Investimento</template>
      <template #content>
        <p
          class="text-2xl font-bold"
          :class="cashFlowData.summary.investment >= 0 ? 'text-green-500' : 'text-red-500'"
        >
          {{ formatCurrency(cashFlowData.summary.investment) }}
        </p>
      </template>
    </Card>
    <Card class="text-center">
      <template #title>Atividades de Financiamento</template>
      <template #content>
        <p
          class="text-2xl font-bold"
          :class="cashFlowData.summary.financing >= 0 ? 'text-green-500' : 'text-red-500'"
        >
          {{ formatCurrency(cashFlowData.summary.financing) }}
        </p>
      </template>
    </Card>
    <Card class="text-center bg-surface-100 dark:bg-surface-800">
      <template #title>Fluxo de Caixa Líquido</template>
      <template #content>
        <p
          class="text-2xl font-bold"
          :class="cashFlowData.summary.netCashFlow >= 0 ? 'text-green-500' : 'text-red-500'"
        >
          {{ formatCurrency(cashFlowData.summary.netCashFlow) }}
        </p>
      </template>
    </Card>
  </div>

  <Card class="mb-6">
    <template #title>Evolução Mensal do Fluxo de Caixa</template>
    <template #content>
      <div class="h-96">
        <Chart type="line" :data="evolutionChartData" :options="evolutionChartOptions" />
      </div>
    </template>
  </Card>

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <Card>
      <template #title>Atividades Operacionais</template>
      <template #content>
        <div class="space-y-2">
          <div
            v-for="item in cashFlowData.details.operational"
            :key="item.name"
            class="flex justify-between"
          >
            <span>{{ item.name }}</span>
            <span :class="item.value >= 0 ? 'text-green-500' : 'text-red-500'">{{
              formatCurrency(item.value)
            }}</span>
          </div>
          <hr class="my-2" />
          <div class="flex justify-between font-bold">
            <span>Total Operacional</span>
            <span>{{ formatCurrency(totalOperational) }}</span>
          </div>
        </div>
      </template>
    </Card>
    <Card>
      <template #title>Atividades de Investimento</template>
      <template #content>
        <div class="space-y-2">
          <div
            v-for="item in cashFlowData.details.investment"
            :key="item.name"
            class="flex justify-between"
          >
            <span>{{ item.name }}</span>
            <span :class="item.value >= 0 ? 'text-green-500' : 'text-red-500'">{{
              formatCurrency(item.value)
            }}</span>
          </div>
          <hr class="my-2" />
          <div class="flex justify-between font-bold">
            <span>Total Investimento</span>
            <span>{{ formatCurrency(totalInvestment) }}</span>
          </div>
        </div>
      </template>
    </Card>
    <Card>
      <template #title>Atividades de Financiamento</template>
      <template #content>
        <div class="space-y-2">
          <div
            v-for="item in cashFlowData.details.financing"
            :key="item.name"
            class="flex justify-between"
          >
            <span>{{ item.name }}</span>
            <span :class="item.value >= 0 ? 'text-green-500' : 'text-red-500'">{{
              formatCurrency(item.value)
            }}</span>
          </div>
          <hr class="my-2" />
          <div class="flex justify-between font-bold">
            <span>Total Financiamento</span>
            <span>{{ formatCurrency(totalFinancing) }}</span>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

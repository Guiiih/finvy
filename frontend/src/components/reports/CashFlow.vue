<script setup lang="ts">
import Card from 'primevue/card'
import Chart from 'primevue/chart'
import { ref, computed } from 'vue'
import { useReportStore } from '@/stores/reportStore'

const reportStore = useReportStore()

const cashFlowData = computed(() => reportStore.cashFlow)

// Função para formatar valores monetários
const formatCurrency = (value: number) => {
  const formatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    value,
  )
  return value < 0 ? `-${formatted.replace('-', '')}` : formatted
}

// Propriedades computadas para totais e dados do gráfico
const totalOperational = computed(
  () => cashFlowData.value?.details.operational.reduce((sum, item) => sum + item.value, 0) || 0,
)
const totalInvestment = computed(
  () => cashFlowData.value?.details.investment.reduce((sum, item) => sum + item.value, 0) || 0,
)
const totalFinancing = computed(
  () => cashFlowData.value?.details.financing.reduce((sum, item) => sum + item.value, 0) || 0,
)

const evolutionChartData = computed(() => ({
  labels: cashFlowData.value?.evolution.labels,
  datasets: [
    {
      label: 'Entradas',
      data: cashFlowData.value?.evolution.inflows,
      borderColor: '#22C55E',
      backgroundColor: 'rgba(34, 197, 94, 0.2)',
      fill: true,
      tension: 0.4,
    },
    {
      label: 'Saídas',
      data: cashFlowData.value?.evolution.outflows,
      borderColor: '#EF4444',
      backgroundColor: 'rgba(239, 68, 68, 0.2)',
      fill: true,
      tension: 0.4,
    },
    {
      label: 'Fluxo Líquido',
      data: cashFlowData.value?.evolution.net,
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
</script>

<template>
  <div v-if="cashFlowData" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
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

  <Card v-if="cashFlowData" class="mb-6">
    <template #title>Evolução Mensal do Fluxo de Caixa</template>
    <template #content>
      <div class="h-96">
        <Chart type="line" :data="evolutionChartData" :options="evolutionChartOptions" />
      </div>
    </template>
  </Card>

  <div v-if="cashFlowData" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

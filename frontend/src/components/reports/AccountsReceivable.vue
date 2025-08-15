<script setup lang="ts">
import Card from 'primevue/card'
import Chart from 'primevue/chart'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import ProgressBar from 'primevue/progressbar'
import { ref, computed } from 'vue'
import { useReportStore } from '@/stores/reportStore'

const reportStore = useReportStore()

const accountsReceivableData = computed(() => reportStore.accountsReceivable)

// Função para formatar valores monetários
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

// Opções do gráfico
const agingChartOptions = ref({
  plugins: {
    legend: {
      position: 'right',
      labels: { usePointStyle: true },
    },
  },
})

// Dados computados para o gráfico
const agingChartData = computed(() => ({
  labels: Object.keys(accountsReceivableData.value?.aging || {}).map(
    (k) =>
      `${k} dias (${accountsReceivableData.value?.aging[k as keyof typeof accountsReceivableData.value.aging].percentage}%)`,
  ),
  datasets: [
    {
      data: Object.values(accountsReceivableData.value?.aging || {}).map(
        (v: { value: number; percentage: number }) => v.value,
      ),
      backgroundColor: ['#3B82F6', '#F97316', '#F59E0B', '#EF4444'],
    },
  ],
}))

const getStatusSeverity = (status: string) => {
  return status === 'Em dia' ? 'success' : 'danger'
}
</script>

<template>
  <div v-if="accountsReceivableData" class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
    <Card class="text-center">
      <template #title>Total a Receber</template>
      <template #content>
        <p class="text-3xl font-bold text-blue-500">
          {{ formatCurrency(accountsReceivableData.summary.totalToReceive) }}
        </p>
        <p class="text-surface-500">{{ accountsReceivableData.summary.clients }} clientes</p>
      </template>
    </Card>
    <Card class="text-center">
      <template #title>Valores em Atraso</template>
      <template #content>
        <p class="text-3xl font-bold text-red-500">
          {{ formatCurrency(accountsReceivableData.summary.overdue) }}
        </p>
        <p class="text-surface-500">
          {{ accountsReceivableData.summary.overduePercentage }}% do total
        </p>
      </template>
    </Card>
    <Card>
      <template #title>Análise de Aging</template>
      <template #content>
        <div class="h-48 flex items-center justify-center">
          <Chart type="pie" :data="agingChartData" :options="agingChartOptions" />
        </div>
      </template>
    </Card>
  </div>

  <div v-if="accountsReceivableData" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <Card>
      <template #title>Detalhamento por Cliente</template>
      <template #content>
        <DataTable :value="accountsReceivableData.details" responsiveLayout="scroll">
          <Column field="client" header="Cliente"></Column>
          <Column field="value" header="Valor">
            <template #body="{ data }">{{ formatCurrency(data.value) }}</template>
          </Column>
          <Column field="dueDate" header="Vencimento"></Column>
          <Column field="status" header="Status">
            <template #body="{ data }">
              <Tag :severity="getStatusSeverity(data.status)" :value="data.status"></Tag>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>
    <Card>
      <template #title>Análise de Aging</template>
      <template #content>
        <div class="space-y-4">
          <div v-for="(data, range) in accountsReceivableData.aging" :key="range">
            <div class="flex justify-between mb-1">
              <span>{{ range }} dias</span>
              <span class="font-medium"
                >{{ formatCurrency(data.value) }} ({{ data.percentage }}%)</span
              >
            </div>
            <ProgressBar
              :value="data.percentage"
              :showValue="false"
              style="height: 1.5rem"
            ></ProgressBar>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

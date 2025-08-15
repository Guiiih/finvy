<script setup lang="ts">
import { ref, computed } from 'vue'
import Card from 'primevue/card'
import Chart from 'primevue/chart'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import { useReportStore } from '@/stores/reportStore'

const reportStore = useReportStore()
const activeTab = ref(0)

const balanceSheetData = computed(() => reportStore.balanceSheet)

// Função para formatar valores monetários
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

// Propriedades computadas para totais e dados do gráfico
const totalAssets = computed(
  () =>
    (balanceSheetData.value?.detailed.assets.current?.reduce((s, i) => s + i.value, 0) || 0) +
    (balanceSheetData.value?.detailed.assets.nonCurrent?.reduce((s, i) => s + i.value, 0) || 0),
)

const totalLiabilitiesAndEquity = computed(
  () =>
    (balanceSheetData.value?.detailed.liabilitiesAndEquity.current?.reduce(
      (s, i) => s + i.value,
      0,
    ) || 0) +
    (balanceSheetData.value?.detailed.liabilitiesAndEquity.nonCurrent?.reduce(
      (s, i) => s + i.value,
      0,
    ) || 0) +
    (balanceSheetData.value?.detailed.liabilitiesAndEquity.equity?.reduce(
      (s, i) => s + i.value,
      0,
    ) || 0),
)

const chartData = computed(() => ({
  labels: [
    'Ativo Circulante',
    'Ativo Não Circulante',
    'Patrimônio Líquido',
    'Passivo Não Circulante',
    'Passivo Circulante',
  ],
  datasets: [
    {
      data: [
        balanceSheetData.value?.summary.composition.currentAssets,
        balanceSheetData.value?.summary.composition.nonCurrentAssets,
        balanceSheetData.value?.summary.composition.equity,
        balanceSheetData.value?.summary.composition.nonCurrentLiabilities,
        balanceSheetData.value?.summary.composition.currentLiabilities,
      ],
      backgroundColor: ['#3B82F6', '#10B981', '#8B5CF6', '#F97316', '#F59E0B'],
    },
  ],
}))

const chartOptions = ref({
  plugins: {
    legend: {
      position: 'right',
      labels: { usePointStyle: true },
    },
  },
})
</script>

<template>
  <TabView v-model:activeIndex="activeTab">
    <TabPanel header="Resumo" :value="0">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <template #title>Composição Patrimonial</template>
          <template #content>
            <div class="h-96 flex items-center justify-center">
              <Chart type="pie" :data="chartData" :options="chartOptions" />
            </div>
          </template>
        </Card>
        <Card>
          <template #title>Indicadores</template>
          <template #content>
            <div class="flex flex-col gap-8" v-if="balanceSheetData">
              <div class="text-center">
                <p class="text-lg text-surface-500">Total de Ativos</p>
                <p class="text-3xl font-bold text-green-500">
                  {{ formatCurrency(balanceSheetData.summary.totalAssets) }}
                </p>
              </div>
              <div class="text-center">
                <p class="text-lg text-surface-500">Patrimônio Líquido</p>
                <p class="text-3xl font-bold text-blue-500">
                  {{ formatCurrency(balanceSheetData.summary.shareholdersEquity) }}
                </p>
              </div>
              <div class="space-y-4 mt-4">
                <div class="flex justify-between">
                  <span class="font-medium">Liquidez Corrente</span>
                  <span>{{ balanceSheetData.summary.indicators.currentLiquidity }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="font-medium">Endividamento</span>
                  <span>{{ balanceSheetData.summary.indicators.indebtedness }}%</span>
                </div>
                <div class="flex justify-between">
                  <span class="font-medium">ROE</span>
                  <span>{{ balanceSheetData.summary.indicators.roe }}%</span>
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </TabPanel>
    <TabPanel header="Detalhado" :value="1">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6" v-if="balanceSheetData">
        <Card>
          <template #title>ATIVO</template>
          <template #content>
            <div class="space-y-6">
              <div>
                <h4 class="font-bold mb-2">Ativo Circulante</h4>
                <div
                  v-for="item in balanceSheetData.detailed.assets.current"
                  :key="item.account"
                  class="flex justify-between py-1 border-b border-surface-200"
                >
                  <span>{{ item.account }}</span>
                  <span>{{ formatCurrency(item.value) }}</span>
                </div>
              </div>
              <div>
                <h4 class="font-bold mb-2">Ativo Não Circulante</h4>
                <div
                  v-for="item in balanceSheetData.detailed.assets.nonCurrent"
                  :key="item.account"
                  class="flex justify-between py-1 border-b border-surface-200"
                >
                  <span>{{ item.account }}</span>
                  <span>{{ formatCurrency(item.value) }}</span>
                </div>
              </div>
              <div class="flex justify-between font-bold text-lg pt-2">
                <span>TOTAL DO ATIVO</span>
                <span>{{ formatCurrency(totalAssets) }}</span>
              </div>
            </div>
          </template>
        </Card>
        <Card>
          <template #title>PASSIVO + PATRIMÔNIO LÍQUIDO</template>
          <template #content>
            <div class="space-y-6">
              <div>
                <h4 class="font-bold mb-2">Passivo Circulante</h4>
                <div
                  v-for="item in balanceSheetData.detailed.liabilitiesAndEquity.current"
                  :key="item.account"
                  class="flex justify-between py-1 border-b border-surface-200"
                >
                  <span>{{ item.account }}</span>
                  <span>{{ formatCurrency(item.value) }}</span>
                </div>
              </div>
              <div>
                <h4 class="font-bold mb-2">Passivo Não Circulante</h4>
                <div
                  v-for="item in balanceSheetData.detailed.liabilitiesAndEquity.nonCurrent"
                  :key="item.account"
                  class="flex justify-between py-1 border-b border-surface-200"
                >
                  <span>{{ item.account }}</span>
                  <span>{{ formatCurrency(item.value) }}</span>
                </div>
              </div>
              <div>
                <h4 class="font-bold mb-2">Patrimônio Líquido</h4>
                <div
                  v-for="item in balanceSheetData.detailed.liabilitiesAndEquity.equity"
                  :key="item.account"
                  class="flex justify-between py-1 border-b border-surface-200"
                >
                  <span>{{ item.account }}</span>
                  <span>{{ formatCurrency(item.value) }}</span>
                </div>
              </div>
              <div class="flex justify-between font-bold text-lg pt-2">
                <span>TOTAL PASSIVO + PL</span>
                <span>{{ formatCurrency(totalLiabilitiesAndEquity) }}</span>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </TabPanel>
  </TabView>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Chart from 'primevue/chart'

// --- PROPS & EMITS ---
interface AnalyticsCategory {
  name: string
  value: number
}

interface AnalyticsData {
  valueByCategory: AnalyticsCategory[]
}

const props = defineProps<{
  analyticsData: AnalyticsData | null
  totalProducts: number
  totalInventoryValue: number
  lowStockProducts: number
  outOfStockProducts: number
  formatCurrency: (value: number) => string
}>()

const emit = defineEmits(['export'])
const visible = defineModel<boolean>('visible')

// --- STATE ---
const activeAnalyticsTab = ref('visaoGeral')

// --- COMPUTED ---
const pieChartData = computed(() => ({
  labels: props.analyticsData?.valueByCategory.map((c) => c.name) || [],
  datasets: [
    {
      data: props.analyticsData?.valueByCategory.map((c) => c.value) || [],
      backgroundColor: [
        '#42A5F5',
        '#66BB6A',
        '#FFA726',
        '#26C6DA',
        '#7E57C2',
        '#EC407A',
        '#FF7043',
      ],
    },
  ],
}))

const chartOptions = { responsive: true, maintainAspectRatio: false }

// --- METHODS ---
const handleExport = () => {
  emit('export')
}
</script>

<template>
  <Dialog v-model:visible="visible" :modal="true" class="w-full max-w-6xl">
    <template #header>
      <div class="flex flex-col">
        <div class="flex items-center gap-3">
          <i class="pi pi-chart-bar text-xl"></i>
          <span class="text-xl font-bold">Análise de Produtos</span>
        </div>
        <span class="text-sm text-surface-500 mt-1"
          >Visualizações e métricas detalhadas do catálogo de produtos</span
        >
      </div>
    </template>

    <div class="p-4">
      <div class="bg-surface-100 rounded-lg p-1 flex gap-1">
        <Button
          label="Visão Geral"
          @click="activeAnalyticsTab = 'visaoGeral'"
          :class="[
            'w-full !text-sm !py-2',
            activeAnalyticsTab === 'visaoGeral'
              ? '!bg-white !text-surface-900 shadow-sm'
              : 'bg-transparent !text-surface-600 hover:!bg-surface-200/50',
          ]"
          link
        />
        <Button
          label="Categorias"
          @click="activeAnalyticsTab = 'categorias'"
          :class="[
            'w-full !text-sm !py-2',
            activeAnalyticsTab === 'categorias'
              ? '!bg-white !text-surface-900 shadow-sm'
              : 'bg-transparent !text-surface-600 hover:!bg-surface-200/50',
          ]"
          link
        />
        <Button
          label="Estoque"
          @click="activeAnalyticsTab = 'estoque'"
          :class="[
            'w-full !text-sm !py-2',
            activeAnalyticsTab === 'estoque'
              ? '!bg-white !text-surface-900 shadow-sm'
              : 'bg-transparent !text-surface-600 hover:!bg-surface-200/50',
          ]"
          link
        />
        <Button
          label="Performance"
          @click="activeAnalyticsTab = 'performance'"
          :class="[
            'w-full !text-sm !py-2',
            activeAnalyticsTab === 'performance'
              ? '!bg-white !text-surface-900 shadow-sm'
              : 'bg-transparent !text-surface-600 hover:!bg-surface-200/50',
          ]"
          link
        />
      </div>

      <div class="mt-6">
        <div v-if="activeAnalyticsTab === 'visaoGeral'">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="p-4 border rounded-lg flex flex-col gap-2">
              <div class="flex items-center gap-2 text-surface-500">
                <i class="pi pi-box"></i>
                <span>Total de Produtos</span>
              </div>
              <div class="text-2xl font-bold">{{ props.totalProducts }}</div>
            </div>
            <div class="p-4 border rounded-lg flex flex-col gap-2">
              <div class="flex items-center gap-2 text-surface-500">
                <i class="pi pi-dollar"></i>
                <span>Valor Total</span>
              </div>
              <div class="text-2xl font-bold">
                {{ props.formatCurrency(props.totalInventoryValue) }}
              </div>
            </div>
            <div class="p-4 border rounded-lg flex flex-col gap-2">
              <div class="flex items-center gap-2 text-red-500">
                <i class="pi pi-exclamation-triangle"></i>
                <span>Alertas</span>
              </div>
              <div class="text-2xl font-bold text-red-500">{{ props.lowStockProducts }}</div>
            </div>
            <div class="p-4 border rounded-lg flex flex-col gap-2">
              <div class="flex items-center gap-2 text-surface-500">
                <i class="pi pi-arrow-up-right"></i>
                <span>Receita</span>
              </div>
              <div class="text-2xl font-bold">R$ 0,00</div>
              <!-- Placeholder -->
            </div>
          </div>
          <div class="mt-8">
            <h3 class="font-medium mb-4">Distribuição de Valor por Categoria</h3>
            <Chart
              type="pie"
              :data="pieChartData"
              :options="chartOptions"
              class="w-full md:w-1/2 mx-auto"
            ></Chart>
          </div>
        </div>
        <div v-if="activeAnalyticsTab === 'categorias'">
          <h3 class="font-medium mb-4">Análise por Categorias</h3>
          <Chart type="bar" :data="pieChartData" :options="chartOptions" class="h-96"></Chart>
        </div>
        <div v-if="activeAnalyticsTab === 'estoque'">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="p-4 border rounded-lg bg-red-50 text-red-700 flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <i class="pi pi-times-circle"></i>
                <span>Sem Estoque</span>
              </div>
              <div class="text-2xl font-bold">{{ props.outOfStockProducts }}</div>
            </div>
            <div class="p-4 border rounded-lg bg-yellow-50 text-yellow-700 flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <i class="pi pi-clock"></i>
                <span>Estoque Baixo</span>
              </div>
              <div class="text-2xl font-bold">{{ props.lowStockProducts }}</div>
            </div>
            <div class="p-4 border rounded-lg bg-green-50 text-green-700 flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <i class="pi pi-check-circle"></i>
                <span>Estoque Normal</span>
              </div>
              <div class="text-2xl font-bold">
                {{ props.totalProducts - props.lowStockProducts - props.outOfStockProducts }}
              </div>
            </div>
          </div>
          <div class="mt-8">
            <h3 class="font-medium mb-4">Produtos Críticos</h3>
            <div class="p-4 border rounded-lg text-center text-surface-500">
              Tabela de produtos críticos aqui.
            </div>
          </div>
        </div>
        <div v-if="activeAnalyticsTab === 'performance'">
          <h3 class="font-medium mb-4">Top 10 Produtos por Receita</h3>
          <div
            class="p-4 border rounded-lg text-center text-surface-500 h-96 flex items-center justify-center"
          >
            Gráfico de Top 10 aqui.
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <Button label="Fechar" severity="secondary" text @click="visible = false" />
      <Button label="Exportar" icon="pi pi-download" @click="handleExport" severity="secondary" />
    </template>
  </Dialog>
</template>

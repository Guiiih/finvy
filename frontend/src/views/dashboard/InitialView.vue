<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useToast } from 'primevue/usetoast'

// --- Interfaces for data structures ---
interface Transaction {
  id: string
  description: string
  account: string
  date: string
  amount: number
  type: 'receita' | 'despesa'
  reference?: string
}

interface Task {
  id: string
  task: string
  priority: 'alta' | 'média' | 'baixa'
  dueDate: string
  description: string
  assignee: string
  estimatedTime: string
  progress: number
  category: string
}

interface SystemAlert {
  id: string
  type: 'warning' | 'error' | 'info' | 'success'
  message: string
  action: string
}

interface ChartTrend {
  name: string
  receitas: number
  despesas: number
  lucro: number
}

interface ChartCategory {
  name: string
  valor: number
  cor: string
}

interface ChartCashflow {
  day: string
  entrada: number
  saida: number
  saldo: number
}

interface TopProduct {
  name: string
  vendas: number
  valor: number
}

// --- Component State ---
const metrics = ref({
  totalRevenue: 0,
  totalExpenses: 0,
  netIncome: 0,
  cashFlow: 0,
  recentTransactions: [] as Transaction[],
})
const monthlyTrend = ref<ChartTrend[]>([])
const categoryData = ref<ChartCategory[]>([])
const cashFlowData = ref<ChartCashflow[]>([])
const topProductsData = ref<TopProduct[]>([])
const pendingTasks = ref<Task[]>([])
const systemAlerts = ref<SystemAlert[]>([])
const activeChartTab = ref('trend')

const loading = ref(false)
const showTaskDetailModal = ref(false)
const showTransactionDetailModal = ref(false)
const showSystemStatusModal = ref(false)
const selectedTask = ref<Task | null>(null)
const selectedTransaction = ref<Transaction | null>(null)
const chartPeriod = ref('6months')

const toast = useToast()

// --- Chart Configurations ---
const mainChartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        usePointStyle: true,
        pointStyle: 'line',
      },
    },
  },
  scales: {
    x: { ticks: { color: '#495057' }, grid: { color: '#ebedef' } },
    y: {
      ticks: { color: '#495057', callback: (value: number) => `R$ ${value / 1000}k` },
      grid: { color: '#ebedef' },
    },
  },
})

const pieChartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
  },
})

const barChartOptions = ref({
  indexAxis: 'y',
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: {
      ticks: { color: '#495057', callback: (value: number) => `R$ ${value / 1000}k` },
      grid: { color: '#ebedef' },
    },
    y: { ticks: { color: '#495057' }, grid: { display: false } },
  },
})

const miniChartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: { x: { display: false }, y: { display: false } },
  elements: { point: { radius: 0 }, line: { borderWidth: 2 } },
})

const trendChartData = computed(() => ({
  labels: monthlyTrend.value.map((d) => d.name),
  datasets: [
    {
      label: 'Despesas',
      data: monthlyTrend.value.map((d) => d.despesas),
      borderColor: '#ef4444',
      tension: 0.4,
    },
    {
      label: 'Lucro',
      data: monthlyTrend.value.map((d) => d.lucro),
      borderColor: '#3b82f6',
      tension: 0.4,
    },
    {
      label: 'Receitas',
      data: monthlyTrend.value.map((d) => d.receitas),
      borderColor: '#10b981',
      tension: 0.4,
    },
  ],
}))
const comparisonChartData = computed(() => ({
  labels: monthlyTrend.value.map((d) => d.name),
  datasets: [
    {
      label: 'Receitas',
      backgroundColor: '#10b981',
      data: monthlyTrend.value.map((d) => d.receitas),
    },
    {
      label: 'Despesas',
      backgroundColor: '#ef4444',
      data: monthlyTrend.value.map((d) => d.despesas),
    },
  ],
}))
const cashflowChartData = computed(() => ({
  labels: cashFlowData.value.map((d) => d.day),
  datasets: [
    {
      label: 'Saldo',
      data: cashFlowData.value.map((d) => d.saldo),
      borderColor: '#3b82f6',
      tension: 0.4,
      fill: true,
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
    },
  ],
}))
const categoryChartData = computed(() => ({
  labels: categoryData.value.map((d) => d.name),
  datasets: [
    {
      data: categoryData.value.map((d) => d.valor),
      backgroundColor: categoryData.value.map((d) => d.cor),
    },
  ],
}))
const topProductsChartData = computed(() => ({
  labels: topProductsData.value.map((d) => d.name),
  datasets: [{ data: topProductsData.value.map((d) => d.valor), backgroundColor: '#3b82f6' }],
}))

const revenueMiniChartData = computed(() => ({
  labels: monthlyTrend.value.map((d) => d.name),
  datasets: [
    {
      data: monthlyTrend.value.map((d) => d.receitas),
      borderColor: '#10b981',
      fill: true,
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      tension: 0.4,
    },
  ],
}))
const expenseMiniChartData = computed(() => ({
  labels: monthlyTrend.value.map((d) => d.name),
  datasets: [
    {
      data: monthlyTrend.value.map((d) => d.despesas),
      borderColor: '#ef4444',
      fill: true,
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      tension: 0.4,
    },
  ],
}))
const profitMiniChartData = computed(() => ({
  labels: monthlyTrend.value.map((d) => d.name),
  datasets: [
    {
      data: monthlyTrend.value.map((d) => d.lucro),
      borderColor: '#3b82f6',
      fill: true,
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
    },
  ],
}))
const cashflowMiniChartData = computed(() => ({
  labels: cashFlowData.value.map((d) => d.day),
  datasets: [
    {
      data: cashFlowData.value.map((d) => d.saldo),
      borderColor: '#8b5cf6',
      fill: true,
      backgroundColor: 'rgba(139, 92, 246, 0.1)',
      tension: 0.4,
    },
  ],
}))

// --- Methods ---
const openTaskDetail = (task: Task) => {
  selectedTask.value = task
  showTaskDetailModal.value = true
}
const openTransactionDetail = (transaction: Transaction) => {
  selectedTransaction.value = transaction
  showTransactionDetailModal.value = true
}
const markTaskComplete = async (taskId: string | undefined) => {
  if (!taskId) return
  loading.value = true
  await new Promise((resolve) => setTimeout(resolve, 1000))
  loading.value = false
  showTaskDetailModal.value = false
  toast.add({
    severity: 'success',
    summary: 'Sucesso',
    detail: 'Tarefa marcada como concluída!',
    life: 3000,
  })
}
const handleSystemAction = async (action: string) => {
  loading.value = true
  await new Promise((resolve) => setTimeout(resolve, 1500))
  loading.value = false
  toast.add({
    severity: 'success',
    summary: 'Sucesso',
    detail: `Ação "${action}" executada com sucesso!`,
    life: 3000,
  })
}

onMounted(() => {
  // TODO: Implementar a busca de dados da API
})
</script>

<template>
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <Toast />

    <!-- Key Metrics -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card class="p-4 border border-surface-200">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm text-surface-500 mb-1">Receitas do Mês</p>
            <p class="text-2xl font-bold">
              {{
                new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  metrics.totalRevenue,
                )
              }}
            </p>
            <p class="text-xs text-surface-400 flex items-center">
              +18% em relação ao mês anterior
            </p>
          </div>
          
        </div>
        <div class="h-16 mt-4">
          <Chart type="line" :data="revenueMiniChartData" :options="miniChartOptions" />
        </div>
      </Card>
      <Card class="p-4 border border-surface-200">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm text-surface-500 mb-1">Despesas do Mês</p>
            <p class="text-2xl font-bold">
              {{
                new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  metrics.totalExpenses,
                )
              }}
            </p>
            <p class="text-xs text-surface-400 flex items-center">
              +5% em relação ao mês anterior
            </p>
          </div>
          
        </div>
        <div class="h-16 mt-4">
          <Chart type="line" :data="expenseMiniChartData" :options="miniChartOptions" />
        </div>
      </Card>
      <Card class="p-4 border border-surface-200">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm text-surface-500 mb-1">Lucro Líquido</p>
            <p class="text-2xl font-bold">
              {{
                new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  metrics.netIncome,
                )
              }}
            </p>
            <p class="text-xs text-surface-400 flex items-center">
              +24% em relação ao mês anterior
            </p>
          </div>
          
        </div>
        <div class="h-16 mt-4">
          <Chart type="line" :data="profitMiniChartData" :options="miniChartOptions" />
        </div>
      </Card>
      <Card class="p-4 border border-surface-200">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm text-surface-500 mb-1">Caixa Atual</p>
            <p class="text-2xl font-bold">
              {{
                new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  metrics.cashFlow,
                )
              }}
            </p>
            <p class="text-xs text-surface-400">Saldo disponível em caixa</p>
          </div>
          
        </div>
        <div class="h-16 mt-4">
          <Chart type="line" :data="cashflowMiniChartData" :options="miniChartOptions" />
        </div>
      </Card>
    </div>

    <!-- Charts Section -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
      <Card class="xl:col-span-2 p-4 border border-surface-200">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-lg font-semibold">Análise Financeira</h2>
            <p class="text-sm text-surface-500">
              Evolução de receitas, despesas e lucro ao longo do tempo
            </p>
          </div>
          <Dropdown
            v-model="chartPeriod"
            :options="[
              { label: '3 meses', value: '3months' },
              { label: '6 meses', value: '6months' },
              { label: '1 ano', value: '1year' },
            ]"
            optionLabel="label"
            optionValue="value"
            class="w-32"
          />
        </div>
        <div class="space-y-4">
          <div class="bg-surface-50 rounded-md p-1 flex flex-wrap justify-center">
            <button
              @click="activeChartTab = 'trend'"
              :class="[
                'flex-1 text-center py-1.5 px-4 rounded-md text-sm font-medium',
                activeChartTab === 'trend'
                  ? 'bg-white shadow-sm'
                  : 'text-surface-600 hover:bg-surface-100',
              ]"
            >
              Tendência
            </button>
            <button
              @click="activeChartTab = 'comparison'"
              :class="[
                'flex-1 text-center py-1.5 px-4 rounded-md text-sm font-medium',
                activeChartTab === 'comparison'
                  ? 'bg-white shadow-sm'
                  : 'text-surface-600 hover:bg-surface-100',
              ]"
            >
              Comparativo
            </button>
            <button
              @click="activeChartTab = 'cashflow'"
              :class="[
                'flex-1 text-center py-1.5 px-4 rounded-md text-sm font-medium',
                activeChartTab === 'cashflow'
                  ? 'bg-white shadow-sm'
                  : 'text-surface-600 hover:bg-surface-100',
              ]"
            >
              Fluxo de Caixa
            </button>
          </div>
          <div v-if="activeChartTab === 'trend'" class="h-80">
            <Chart type="line" :data="trendChartData" :options="mainChartOptions" />
          </div>
          <div v-if="activeChartTab === 'comparison'" class="h-80">
            <Chart type="bar" :data="comparisonChartData" :options="mainChartOptions" />
          </div>
          <div v-if="activeChartTab === 'cashflow'" class="h-80">
            <Chart type="line" :data="cashflowChartData" :options="mainChartOptions" />
          </div>
        </div>
      </Card>

      <Card class="p-4 border border-surface-200">
        <div>
          <h2 class="text-lg font-semibold">Distribuição por Categoria</h2>
          <p class="text-sm text-surface-500">Análise de receitas e despesas por categoria</p>
        </div>
        <div class="h-64 mt-4">
          <Chart type="pie" :data="categoryChartData" :options="pieChartOptions" />
        </div>
        <div class="space-y-2 mt-4">
          <div
            v-for="item in categoryData"
            :key="item.name"
            class="flex items-center justify-between text-sm"
          >
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: item.cor }"></div>
              <span class="text-surface-600">{{ item.name }}</span>
            </div>
            <span class="font-medium">{{
              new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                item.valor,
              )
            }}</span>
          </div>
        </div>
      </Card>
    </div>

    <!-- Top Products & Recent Transactions -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <Card class="lg:col-span-2 p-4 border border-surface-200">
        <div>
          <h2 class="text-lg font-semibold">Top Produtos por Performance</h2>
          <p class="text-sm text-surface-500">Produtos com melhor desempenho em vendas e receita</p>
        </div>
        <div class="h-64 mt-4">
          <Chart type="bar" :data="topProductsChartData" :options="barChartOptions" />
        </div>
      </Card>

      <Card class="p-4 border border-surface-200">
        <div>
          <h2 class="text-lg font-semibold">Últimas Transações</h2>
          <p class="text-sm text-surface-500">Lançamentos mais recentes do sistema</p>
        </div>
        <div class="space-y-3 mt-4">
          <div v-if="!metrics.recentTransactions.length" class="text-center text-surface-500 py-4">
            Nenhuma transação recente.
          </div>
          <div
            v-for="transaction in metrics.recentTransactions"
            :key="transaction.id"
            @click="openTransactionDetail(transaction)"
            class="flex items-start justify-between cursor-pointer hover:bg-surface-50 p-2 rounded"
          >
            <div class="space-y-1">
              <p class="font-medium text-sm">{{ transaction.description }}</p>
              <p class="text-xs text-surface-400">{{ transaction.account }}</p>
              <p class="text-xs text-surface-400">{{ transaction.date }}</p>
            </div>
            <div class="text-right shrink-0 ml-4">
              <p
                :class="[
                  'font-medium text-sm',
                  transaction.amount > 0 ? 'text-green-600' : 'text-red-600',
                ]"
              >
                {{
                  (transaction.amount > 0 ? '+' : '') +
                  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    transaction.amount,
                  )
                }}
              </p>
              <Tag
                :value="transaction.type"
                :severity="transaction.type === 'receita' ? 'success' : 'danger'"
                class="text-xs"
              ></Tag>
            </div>
          </div>
        </div>
        <Button label="Ver Todas as Transações" icon="pi pi-eye" text class="w-full mt-4" />
      </Card>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <Card class="p-4 border border-surface-200">
        <div>
          <h2 class="text-lg font-semibold">Tarefas Pendentes</h2>
          <p class="text-sm text-surface-500">Itens que requerem sua atenção</p>
        </div>
        <div class="space-y-4 mt-4">
          <div v-if="!pendingTasks.length" class="text-center text-surface-500 py-4">
            Nenhuma tarefa pendente.
          </div>
          <div
            v-for="task in pendingTasks"
            :key="task.id"
            @click="openTaskDetail(task)"
            class="cursor-pointer hover:bg-surface-50 p-3 rounded-lg border border-surface-200"
          >
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-3">
                <div
                  :class="[
                    'w-2.5 h-2.5 rounded-full',
                    task.priority === 'alta'
                      ? 'bg-red-500'
                      : task.priority === 'média'
                        ? 'bg-yellow-500'
                        : 'bg-green-500',
                  ]"
                ></div>
                <p class="font-medium">{{ task.task }}</p>
              </div>
              <Tag
                :value="task.priority"
                :severity="
                  task.priority === 'alta'
                    ? 'danger'
                    : task.priority === 'média'
                      ? 'warning'
                      : 'info'
                "
                class="capitalize"
              ></Tag>
            </div>
            <div class="text-sm text-surface-500 mb-2">Vence em: {{ task.dueDate }}</div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-surface-500">{{ task.assignee }}</span>
              <span class="font-medium">{{ task.progress }}% concluído</span>
            </div>
            <ProgressBar :value="task.progress" :showValue="false" class="h-2 mt-1"></ProgressBar>
          </div>
        </div>
      </Card>

      <Card class="p-4 border border-surface-200">
        <div>
          <h2 class="text-lg font-semibold">Status do Sistema</h2>
          <p class="text-sm text-surface-500">Alertas e notificações importantes</p>
        </div>
        <div class="space-y-3 mt-4">
          <div v-if="!systemAlerts.length" class="text-center text-surface-500 py-4">
            Nenhum alerta do sistema.
          </div>
          <div
            v-for="alert in systemAlerts"
            :key="alert.id"
            class="flex items-center justify-between p-3 rounded-lg border border-surface-200"
          >
            <div class="flex items-center gap-3">
              <i
                :class="[
                  'pi',
                  alert.type === 'error'
                    ? 'pi-times-circle text-red-500'
                    : alert.type === 'warning'
                      ? 'pi-exclamation-triangle text-yellow-500'
                      : alert.type === 'info'
                        ? 'pi-info-circle text-blue-500'
                        : 'pi-check-circle text-green-500',
                ]"
              ></i>
              <p class="font-medium text-sm">{{ alert.message }}</p>
            </div>
            <Button :label="alert.action" size="small" text />
          </div>
        </div>
      </Card>
    </div>

    <!-- Modals -->
    <Dialog
      v-model:visible="showTaskDetailModal"
      modal
      header="Detalhes da Tarefa"
      :style="{ width: '50rem' }"
    >
      <div v-if="selectedTask" class="space-y-6 p-4">
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <label>Título da Tarefa</label>
            <div class="p-3 bg-surface-50 rounded-lg font-medium">{{ selectedTask.task }}</div>
          </div>
          <div class="space-y-2">
            <label>Prioridade</label>
            <div class="p-3 bg-surface-50 rounded-lg">
              <Tag
                :value="selectedTask.priority"
                :severity="
                  selectedTask.priority === 'alta'
                    ? 'danger'
                    : selectedTask.priority === 'média'
                      ? 'warning'
                      : 'info'
                "
              ></Tag>
            </div>
          </div>
        </div>
        <div class="space-y-2">
          <label>Descrição</label>
          <div class="p-3 bg-surface-50 rounded-lg min-h-20 text-sm">
            {{ selectedTask.description }}
          </div>
        </div>
        <div class="space-y-2">
          <div class="flex justify-between items-center">
            <label>Progresso da Tarefa</label>
            <span class="text-sm font-medium">{{ selectedTask.progress }}%</span>
          </div>
          <ProgressBar :value="selectedTask.progress" class="h-3"></ProgressBar>
        </div>
      </div>
      <template #footer>
        <Button label="Fechar" text @click="showTaskDetailModal = false" />
        <Button
          label="Marcar como Concluída"
          icon="pi pi-check-circle"
          :loading="loading"
          @click="markTaskComplete(selectedTask?.id)"
        />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="showSystemStatusModal"
      modal
      header="Status do Sistema"
      :style="{ width: '50rem' }"
    >
      <div class="space-y-4 p-4">
        <div
          v-for="alert in systemAlerts"
          :key="alert.id"
          class="flex items-center justify-between p-3 border rounded-lg"
        >
          <div class="flex items-center gap-3">
            <i
              :class="[
                'pi',
                alert.type === 'error'
                  ? 'pi-times-circle text-red-500'
                  : alert.type === 'warning'
                    ? 'pi-exclamation-triangle text-yellow-500'
                    : alert.type === 'info'
                      ? 'pi-info-circle text-blue-500'
                      : 'pi-check-circle text-green-500',
              ]"
            ></i>
            <p class="font-medium">{{ alert.message }}</p>
          </div>
          <Button
            :label="alert.action"
            size="small"
            outlined
            @click="handleSystemAction(alert.action)"
            :loading="loading"
          />
        </div>
        <div v-if="!systemAlerts.length" class="text-center text-surface-500 py-4">
          Nenhum alerta do sistema.
        </div>
      </div>
      <template #footer>
        <Button label="Fechar" text @click="showSystemStatusModal = false" />
      </template>
    </Dialog>
  </main>
</template>

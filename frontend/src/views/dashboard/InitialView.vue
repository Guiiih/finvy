<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useToast } from 'primevue/usetoast';

// --- Interfaces for data structures ---
interface Transaction {
  id: string;
  description: string;
  account: string;
  date: string;
  amount: number;
  type: 'receita' | 'despesa';
  reference?: string;
}

interface Task {
  id: string;
  task: string;
  priority: 'alta' | 'média' | 'baixa';
  dueDate: string;
  description: string;
  assignee: string;
  estimatedTime: string;
  progress: number;
  category: string;
}

interface SystemAlert {
    id: string;
    type: 'warning' | 'error' | 'info' | 'success';
    message: string;
    action: string;
}

interface ChartTrend {
    name: string;
    receitas: number;
    despesas: number;
    lucro: number;
}

interface ChartCategory {
    name: string;
    valor: number;
    cor: string;
}

interface ChartCashflow {
    day: string;
    entrada: number;
    saida: number;
    saldo: number;
}

interface ChartProduct {
    name: string;
    vendas: number;
    valor: number;
}

// --- Component State ---
const metrics = ref({
  totalRevenue: 0,
  totalExpenses: 0,
  netIncome: 0,
  cashFlow: 0,
  recentTransactions: [] as Transaction[],
});
const monthlyTrend = ref<ChartTrend[]>([]);
const categoryData = ref<ChartCategory[]>([]);
const cashFlowData = ref<ChartCashflow[]>([]);
const topProductsData = ref<ChartProduct[]>([]);
const pendingTasks = ref<Task[]>([]);
const systemAlerts = ref<SystemAlert[]>([]);

const loading = ref(false);
const showTaskDetailModal = ref(false);
const showTransactionDetailModal = ref(false);
const showSystemStatusModal = ref(false);
const selectedTask = ref<Task | null>(null);
const selectedTransaction = ref<Transaction | null>(null);
const chartPeriod = ref('6months');

const toast = useToast();

// --- Chart Configurations ---
const trendChartData = computed(() => ({
  labels: monthlyTrend.value.map((d) => d.name),
  datasets: [
    { label: 'Receitas', data: monthlyTrend.value.map((d) => d.receitas), borderColor: '#10b981', tension: 0.4, fill: false },
    { label: 'Despesas', data: monthlyTrend.value.map((d) => d.despesas), borderColor: '#ef4444', tension: 0.4, fill: false },
    { label: 'Lucro', data: monthlyTrend.value.map((d) => d.lucro), borderColor: '#3b82f6', tension: 0.4, fill: false }
  ]
}));

const comparisonChartData = computed(() => ({
    labels: monthlyTrend.value.map((d) => d.name),
    datasets: [
        { label: 'Receitas', backgroundColor: '#10b981', data: monthlyTrend.value.map((d) => d.receitas) },
        { label: 'Despesas', backgroundColor: '#ef4444', data: monthlyTrend.value.map((d) => d.despesas) }
    ]
}));

const cashflowChartData = computed(() => ({
    labels: cashFlowData.value.map((d) => d.day),
    datasets: [
        { label: 'Entradas', data: cashFlowData.value.map((d) => d.entrada), borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.6)', fill: true, tension: 0.4 },
        { label: 'Saídas', data: cashFlowData.value.map((d) => d.saida), borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.6)', fill: true, tension: 0.4 }
    ]
}));

const categoryChartData = computed(() => ({
    labels: categoryData.value.map((d) => d.name),
    datasets: [{ data: categoryData.value.map((d) => d.valor), backgroundColor: categoryData.value.map((d) => d.cor) }]
}));

const topProductsChartData = computed(() => ({
    labels: topProductsData.value.map((d) => d.name),
    datasets: [{ label: 'Receita', backgroundColor: '#3b82f6', data: topProductsData.value.map((d) => d.valor) }]
}));

const chartOptions = ref({ responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#495057' } } }, scales: { x: { ticks: { color: '#495057' }, grid: { color: '#ebedef' } }, y: { ticks: { color: '#495057' }, grid: { color: '#ebedef' } } } });
const topProductsChartOptions = ref({ indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#495057' }, grid: { color: '#ebedef' } }, y: { ticks: { color: '#495057' }, grid: { color: '#ebedef' } } } });

// --- Methods ---
const openTaskDetail = (task: Task) => {
  selectedTask.value = task;
  showTaskDetailModal.value = true;
};

const openTransactionDetail = (transaction: Transaction) => {
  selectedTransaction.value = transaction;
  showTransactionDetailModal.value = true;
};

const markTaskComplete = async (taskId: string | undefined) => {
  if (!taskId) return;
  loading.value = true;
  await new Promise(resolve => setTimeout(resolve, 1000));
  loading.value = false;
  showTaskDetailModal.value = false;
  toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Tarefa marcada como concluída!', life: 3000 });
};

const handleSystemAction = async (action: string) => {
  loading.value = true;
  await new Promise(resolve => setTimeout(resolve, 1500));
  loading.value = false;
  toast.add({ severity: 'success', summary: 'Sucesso', detail: `Ação "${action}" executada com sucesso!`, life: 3000 });
};

onMounted(() => {
  // Data fetching logic would go here
});

</script>

<template>
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <Toast />
    <div class="mb-8">
      <h1 class="text-2xl font-bold mb-2">Dashboard</h1>
      <p class="text-surface-500">
        Bem-vindo ao FINVY. Aqui está um resumo das suas atividades financeiras.
      </p>
    </div>

    <!-- Key Metrics -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card class="relative overflow-hidden">
        <template #title>
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium">Receitas do Mês</span>
            <i class="pi pi-dollar text-surface-500"></i>
          </div>
        </template>
        <template #content>
          <div class="text-2xl font-bold">
            {{ new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.totalRevenue) }}
          </div>
          <p class="text-xs text-surface-500 flex items-center">
            <i class="pi pi-arrow-up-right text-green-500 mr-1"></i>
            +18% em relação ao mês anterior
          </p>
        </template>
        <div class="absolute top-0 right-0 w-2 h-full bg-green-500 opacity-20"></div>
      </Card>

      <Card class="relative overflow-hidden">
        <template #title>
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium">Despesas do Mês</span>
            <i class="pi pi-trending-down text-surface-500"></i>
          </div>
        </template>
        <template #content>
          <div class="text-2xl font-bold">
            {{ new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.totalExpenses) }}
          </div>
          <p class="text-xs text-surface-500 flex items-center">
            <i class="pi pi-arrow-up-right text-red-500 mr-1"></i>
            +5% em relação ao mês anterior
          </p>
        </template>
        <div class="absolute top-0 right-0 w-2 h-full bg-red-500 opacity-20"></div>
      </Card>

      <Card class="relative overflow-hidden">
        <template #title>
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium">Lucro Líquido</span>
            <i class="pi pi-chart-line text-surface-500"></i>
          </div>
        </template>
        <template #content>
          <div :class="['text-2xl font-bold', metrics.netIncome >= 0 ? 'text-green-600' : 'text-red-600']">
            {{ new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.netIncome) }}
          </div>
          <p class="text-xs text-surface-500 flex items-center">
            <i class="pi pi-arrow-up-right text-green-500 mr-1"></i>
            +24% em relação ao mês anterior
          </p>
        </template>
        <div class="absolute top-0 right-0 w-2 h-full bg-blue-500 opacity-20"></div>
      </Card>

      <Card class="relative overflow-hidden">
        <template #title>
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium">Caixa Atual</span>
            <i class="pi pi-wallet text-surface-500"></i>
          </div>
        </template>
        <template #content>
          <div class="text-2xl font-bold">
            {{ new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.cashFlow) }}
          </div>
          <p class="text-xs text-surface-500">
            Saldo disponível em caixa
          </p>
        </template>
        <div class="absolute top-0 right-0 w-2 h-full bg-purple-500 opacity-20"></div>
      </Card>
    </div>

    <!-- Charts Section -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
      <Card class="xl:col-span-2">
        <template #title>
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-semibold">Análise Financeira</h2>
              <p class="text-sm text-surface-500">Evolução de receitas, despesas e lucro</p>
            </div>
            <Dropdown v-model="chartPeriod" :options="[{label: '3 meses', value: '3months'}, {label: '6 meses', value: '6months'}, {label: '1 ano', value: '1year'}]" optionLabel="label" optionValue="value" class="w-32" />
          </div>
        </template>
        <template #content>
          <TabView>
            <TabPanel header="Tendência" value="trend">
              <div class="h-80">
                <Chart type="line" :data="trendChartData" :options="chartOptions" />
              </div>
            </TabPanel>
            <TabPanel header="Comparativo" value="comparison">
              <div class="h-80">
                <Chart type="bar" :data="comparisonChartData" :options="chartOptions" />
              </div>
            </TabPanel>
            <TabPanel header="Fluxo de Caixa" value="cashflow">
              <div class="h-80">
                <Chart type="line" :data="cashflowChartData" :options="chartOptions" />
              </div>
            </TabPanel>
          </TabView>
        </template>
      </Card>

      <Card>
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-chart-pie"></i>
            <h2 class="text-lg font-semibold">Distribuição por Categoria</h2>
          </div>
        </template>
        <template #content>
          <div class="h-64">
            <Chart type="pie" :data="categoryChartData" :options="{ responsive: true, maintainAspectRatio: false }" />
          </div>
          <div class="space-y-2 mt-4">
            <div v-for="(item, index) in categoryData" :key="index" class="flex items-center justify-between text-sm">
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: item.cor }"></div>
                <span class="text-surface-500">{{ item.name }}</span>
              </div>
              <span class="font-medium">{{ new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor) }}</span>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Top Products & Recent Transactions -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card class="lg:col-span-2">
            <template #title>
                <div class="flex items-center gap-2">
                    <i class="pi pi-chart-bar"></i>
                    <h2 class="text-lg font-semibold">Top Produtos por Performance</h2>
                </div>
            </template>
            <template #content>
                <div class="h-64">
                    <Chart type="bar" :data="topProductsChartData" :options="topProductsChartOptions" />
                </div>
            </template>
        </Card>

        <Card>
            <template #title>
                <h2 class="text-lg font-semibold">Últimas Transações</h2>
            </template>
            <template #content>
                <div class="space-y-4">
                    <div v-if="!metrics.recentTransactions.length" class="text-center text-surface-500 py-4">
                        Nenhuma transação recente.
                    </div>
                    <div v-for="transaction in metrics.recentTransactions" :key="transaction.id" @click="openTransactionDetail(transaction)" class="flex items-center justify-between border-b pb-4 last:border-b-0 cursor-pointer hover:bg-surface-50 p-2 rounded">
                        <div class="space-y-1">
                            <p class="font-medium">{{ transaction.description }}</p>
                            <p class="text-sm text-surface-500">{{ transaction.account }}</p>
                            <p class="text-xs text-surface-500">{{ transaction.date }}</p>
                        </div>
                        <div class="text-right">
                            <p :class="['font-medium', transaction.amount > 0 ? 'text-green-600' : 'text-red-600']">
                                {{ (transaction.amount > 0 ? '+' : '') + new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(transaction.amount) }}
                            </p>
                            <Tag :value="transaction.type" :severity="transaction.type === 'receita' ? 'success' : 'warning'"></Tag>
                        </div>
                    </div>
                </div>
                <Button label="Ver Todas as Transações" icon="pi pi-eye" outlined class="w-full mt-4" />
            </template>
        </Card>
    </div>

    <div class="grid grid-cols-1 gap-6 mb-8">
        <Card>
            <template #title>
                <h2 class="text-lg font-semibold">Tarefas Pendentes</h2>
            </template>
            <template #content>
                <div class="space-y-4">
                    <div v-if="!pendingTasks.length" class="text-center text-surface-500 py-4">
                        Nenhuma tarefa pendente.
                    </div>
                    <div v-for="task in pendingTasks" :key="task.id" @click="openTaskDetail(task)" class="cursor-pointer hover:bg-surface-50 p-3 rounded border">
                        <div class="flex items-center justify-between mb-2">
                            <div class="flex items-center gap-3">
                                <div :class="['w-2 h-2 rounded-full', task.priority === 'alta' ? 'bg-red-500' : task.priority === 'média' ? 'bg-yellow-500' : 'bg-green-500']"></div>
                                <div>
                                    <p class="font-medium">{{ task.task }}</p>
                                    <div class="flex items-center gap-2 text-sm text-surface-500">
                                        <i class="pi pi-calendar"></i>
                                        {{ task.dueDate }}
                                    </div>
                                </div>
                            </div>
                            <Tag :value="task.priority" :severity="task.priority === 'alta' ? 'danger' : task.priority === 'média' ? 'warning' : 'info'"></Tag>
                        </div>
                        <div class="space-y-1">
                            <div class="flex justify-between text-sm">
                                <span>Progresso</span>
                                <span>{{ task.progress }}%</span>
                            </div>
                            <ProgressBar :value="task.progress" :showValue="false" class="h-2"></ProgressBar>
                        </div>
                    </div>
                </div>
                <Button label="Ver Todas as Tarefas" icon="pi pi-book" outlined class="w-full mt-4" />
            </template>
        </Card>
    </div>

    <!-- System Status -->
    <Card>
        <template #title>
            <div class="flex items-center justify-between">
                <h2 class="text-lg font-semibold">Status do Sistema</h2>
                <Button icon="pi pi-cog" text rounded @click="showSystemStatusModal = true" />
            </div>
        </template>
        <template #content>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="flex items-center justify-between"><span class="text-sm">Sincronização Bancária</span><i class="pi pi-check-circle text-green-500"></i></div>
                <div class="flex items-center justify-between"><span class="text-sm">Backup dos Dados</span><i class="pi pi-exclamation-circle text-yellow-500"></i></div>
                <div class="flex items-center justify-between"><span class="text-sm">Compliance Fiscal</span><i class="pi pi-check-circle text-green-500"></i></div>
                <div class="flex items-center justify-between"><span class="text-sm">Estoque Crítico</span><i class="pi pi-exclamation-circle text-red-500"></i></div>
            </div>
        </template>
    </Card>

    <!-- Modals -->
    <Dialog v-model:visible="showTaskDetailModal" modal header="Detalhes da Tarefa" :style="{ width: '50rem' }">
        <div v-if="selectedTask" class="space-y-6 p-4">
            <div class="grid grid-cols-2 gap-4">
                <div class="space-y-2">
                    <label>Título da Tarefa</label>
                    <div class="p-3 bg-surface-50 rounded-lg font-medium">{{ selectedTask.task }}</div>
                </div>
                <div class="space-y-2">
                    <label>Prioridade</label>
                    <div class="p-3 bg-surface-50 rounded-lg">
                        <Tag :value="selectedTask.priority" :severity="selectedTask.priority === 'alta' ? 'danger' : selectedTask.priority === 'média' ? 'warning' : 'info'"></Tag>
                    </div>
                </div>
            </div>
            <div class="space-y-2">
                <label>Descrição</label>
                <div class="p-3 bg-surface-50 rounded-lg min-h-20 text-sm">{{ selectedTask.description }}</div>
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
            <Button label="Marcar como Concluída" icon="pi pi-check-circle" :loading="loading" @click="markTaskComplete(selectedTask?.id)" />
        </template>
    </Dialog>

    <Dialog v-model:visible="showSystemStatusModal" modal header="Status do Sistema" :style="{ width: '50rem' }">
        <div class="space-y-4 p-4">
            <div v-for="alert in systemAlerts" :key="alert.id" class="flex items-center justify-between p-3 border rounded-lg">
                <div class="flex items-center gap-3">
                    <i :class="['pi', alert.type === 'error' ? 'pi-times-circle text-red-500' : alert.type === 'warning' ? 'pi-exclamation-triangle text-yellow-500' : alert.type === 'info' ? 'pi-info-circle text-blue-500' : 'pi-check-circle text-green-500']"></i>
                    <p class="font-medium">{{ alert.message }}</p>
                </div>
                <Button :label="alert.action" size="small" outlined @click="handleSystemAction(alert.action)" :loading="loading" />
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
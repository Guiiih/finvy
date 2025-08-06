<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import ReportViewer from '@/components/reports/ReportViewer.vue'
// TODO: Importar o serviço da API para buscar os dados
// import { api } from '@/services/api';

// PrimeVue Components
import Button from 'primevue/button'
import Card from 'primevue/card'
import Dropdown from 'primevue/dropdown'
import Tag from 'primevue/tag'
import ProgressBar from 'primevue/progressbar'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Checkbox from 'primevue/checkbox'
import InputSwitch from 'primevue/inputswitch'
import Calendar from 'primevue/calendar'

import Toast from 'primevue/toast'

const toast = useToast()

const loading = ref(true)
const selectedPeriod = ref('current-month')
const showConfigModal = ref(false)
const showScheduleModal = ref(false)
const showCustomReportModal = ref(false)
const selectedReport = ref<string | null>(null)
const viewingReport = ref<{ id: string; title: string } | null>(null)

const reportConfig = reactive({
  includeGraphics: true,
  includeComparisons: true,
  detailLevel: 'summary',
  format: 'pdf',
  orientation: 'portrait',
  includeWatermark: false,
  customTitle: '',
  customFooter: '',
})

const scheduleConfig = reactive({
  frequency: 'monthly',
  dayOfMonth: 1,
  dayOfWeek: 'monday',
  time: '09:00',
  recipients: [''],
  includeAttachment: true,
  autoGenerate: true,
})

const customReport = reactive({
  name: '',
  description: '',
  accounts: [] as string[],
  dateRange: 'custom',
  startDate: new Date(),
  endDate: new Date(),
  groupBy: 'account',
  includeSubaccounts: true,
  showZeroBalances: false,
})

const periodOptions = [
  { value: 'current-month', label: 'Mês atual' },
  { value: 'last-month', label: 'Mês anterior' },
  { value: 'current-quarter', label: 'Trimestre atual' },
  { value: 'current-year', label: 'Ano atual' },
  { value: 'last-year', label: 'Ano anterior' },
]

interface ReportType {
  id: string
  title: string
  description: string
  icon: string
  category: string
  lastGenerated: string
  status: string
}

interface KeyMetrics {
  totalRevenue: number
  totalExpenses: number
  netIncome: number
  totalAssets: number
  totalLiabilities: number
  equity: number
  cashFlow: number
  grossMargin: number
}

interface QuickStat {
  title: string
  value: number
  change: string
  trend: 'up' | 'down'
  icon: string
  isPercentage?: boolean
}

interface AvailableAccount {
  value: string
  label: string
}

// TODO: Substituir por dados reais da API
const reportTypes = ref<ReportType[]>([])

// TODO: Substituir por dados reais da API
const keyMetrics = reactive<KeyMetrics>({
  totalRevenue: 0,
  totalExpenses: 0,
  netIncome: 0,
  totalAssets: 0,
  totalLiabilities: 0,
  equity: 0,
  cashFlow: 0,
  grossMargin: 0,
})

// TODO: Substituir por dados reais da API
const quickStats = computed<QuickStat[]>(() => [
  {
    title: 'Receita Bruta',
    value: keyMetrics.totalRevenue,
    change: '',
    trend: 'up',
    icon: 'pi pi-arrow-up-right',
  },
  {
    title: 'Despesas Totais',
    value: keyMetrics.totalExpenses,
    change: '',
    trend: 'up',
    icon: 'pi pi-arrow-down-left',
  },
  {
    title: 'Lucro Líquido',
    value: keyMetrics.netIncome,
    change: '',
    trend: 'up',
    icon: 'pi pi-dollar',
  },
  {
    title: 'Margem Bruta',
    value: keyMetrics.grossMargin,
    change: '',
    trend: 'up',
    icon: 'pi pi-chart-bar',
    isPercentage: true,
  },
])

// TODO: Substituir por dados reais da API
const availableAccounts = ref<AvailableAccount[]>([])

// TODO: Implementar a busca de dados reais da API para os quickStats e availableAccounts
const fetchDashboardData = async () => {
  loading.value = true
  try {
    // const response = await api.get('/reports/dashboard-summary');
    // Object.assign(keyMetrics, response.data.keyMetrics);
    // availableAccounts.value = response.data.availableAccounts;
    // reportTypes.value = response.data.reportTypes;

    // const response = await api.get('/reports/dashboard-summary');
    // Object.assign(keyMetrics, response.data.keyMetrics);
    // availableAccounts.value = response.data.availableAccounts;
    // reportTypes.value = response.data.reportTypes;

    // TODO: Implementar a busca de dados reais da API para os quickStats e availableAccounts
    // const response = await api.get('/reports/dashboard-summary');
    // Object.assign(keyMetrics, response.data.keyMetrics);
    // availableAccounts.value = response.data.availableAccounts;
    // reportTypes.value = response.data.reportTypes;

    // Dados mocados para demonstração. Substituir por chamadas de API reais.
    await new Promise((resolve) => setTimeout(resolve, 500))
    Object.assign(keyMetrics, { totalRevenue: 0, totalExpenses: 0, netIncome: 0, grossMargin: 0 })
    availableAccounts.value = []
    reportTypes.value = [
      {
        id: 'balance-sheet',
        title: 'Balanço Patrimonial',
        description: 'Demonstração da posição financeira da empresa',
        icon: 'pi pi-chart-bar',
        category: 'Demonstrações Financeiras',
        lastGenerated: '01/08/2025',
        status: 'Disponível',
      },
      {
        id: 'income-statement',
        title: 'Demonstração de Resultado',
        description: 'Análise de receitas, custos e despesas do período',
        icon: 'pi pi-arrow-up-right',
        category: 'Demonstrações Financeiras',
        lastGenerated: '01/08/2025',
        status: 'Disponível',
      },
      {
        id: 'cash-flow',
        title: 'Fluxo de Caixa',
        description: 'Movimentações de entrada e saída de recursos',
        icon: 'pi pi-dollar',
        category: 'Demonstrações Financeiras',
        lastGenerated: '02/08/2025',
        status: 'Disponível',
      },
      {
        id: 'trial-balance',
        title: 'Balancete de Verificação',
        description: 'Saldos de todas as contas contábeis',
        icon: 'pi pi-file',
        category: 'Relatórios Auxiliares',
        lastGenerated: '02/08/2025',
        status: 'Disponível',
      },
      {
        id: 'accounts-receivable',
        title: 'Contas a Receber',
        description: 'Relatório de valores a receber de clientes',
        icon: 'pi pi-chart-pie',
        category: 'Relatórios Gerenciais',
        lastGenerated: '01/08/2025',
        status: 'Disponível',
      },
      {
        id: 'accounts-payable',
        title: 'Contas a Pagar',
        description: 'Relatório de valores a pagar para fornecedores',
        icon: 'pi pi-arrow-down-left',
        category: 'Relatórios Gerenciais',
        lastGenerated: '01/08/2025',
        status: 'Disponível',
      },
      {
        id: 'inventory-report',
        title: 'Relatório de Estoque',
        description: 'Posição atual do inventário de produtos',
        icon: 'pi pi-box',
        category: 'Relatórios Operacionais',
        lastGenerated: '02/08/2025',
        status: 'Disponível',
      },
    ]
  } catch (err) {
    console.error('Erro ao buscar dados do dashboard:', err)
  } finally {
    loading.value = false
  }
}

onMounted(fetchDashboardData)

const generateReport = (reportId: string) => {
  const report = reportTypes.value.find((r) => r.id === reportId)
  if (report) {
    viewingReport.value = { id: reportId, title: report.title }
  }
}

const showExportModal = ref(false)
const exportReportId = ref<string | null>(null)

const openExportModal = (reportId: string) => {
  exportReportId.value = reportId
  showExportModal.value = true
}

const handleExportReport = async () => {
  if (!exportReportId.value || !reportConfig.format) {
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: 'Selecione o formato de exportação.',
      life: 3000,
    })
    return
  }
  loading.value = true
  try {
    // TODO: Implementar a chamada real da API para exportar o relatório
    // const response = await api.post('/reports/export', { reportId: exportReportId.value, format: reportConfig.format, ...reportConfig });
    // const blob = new Blob([response], { type: response.headers['content-type'] });
    // const link = document.createElement('a');
    // link.href = URL.createObjectURL(blob);
    // link.download = `report.${exportReportId.value}.${reportConfig.format}`;
    // link.click();
    // URL.revokeObjectURL(link.href);

    toast.add({
      severity: 'success',
      summary: 'Sucesso',
      detail: `Relatório exportado em ${reportConfig.format.toUpperCase()} com sucesso!`,
      life: 3000,
    })
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: 'Falha ao exportar relatório.',
      life: 3000,
    })
  } finally {
    loading.value = false
    showExportModal.value = false
  }
}

const handleConfigureReport = (reportId: string) => {
  selectedReport.value = reportId
  showConfigModal.value = true
}

const handleScheduleReport = (reportId: string) => {
  selectedReport.value = reportId
  showScheduleModal.value = true
}

const handleSaveConfig = async () => {
  loading.value = true
  try {
    // TODO: Implementar a chamada real da API para salvar configurações do relatório
    // await api.post('/reports/config', { reportId: selectedReport.value, config: reportConfig });
    toast.add({
      severity: 'success',
      summary: 'Sucesso',
      detail: 'Configurações do relatório salvas!',
      life: 3000,
    })
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: 'Falha ao exportar relatório.',
      life: 3000,
    })
  } finally {
    loading.value = false
    showConfigModal.value = false
  }
}

const handleSaveSchedule = async () => {
  if (!scheduleConfig.recipients[0]) {
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: 'Adicione pelo menos um destinatário',
      life: 3000,
    })
    return
  }
  loading.value = true
  try {
    // TODO: Implementar a chamada real da API para agendar o relatório
    // await api.post('/reports/schedule', { reportId: selectedReport.value, schedule: scheduleConfig });
    toast.add({
      severity: 'success',
      summary: 'Sucesso',
      detail: 'Agendamento do relatório configurado!',
      life: 3000,
    })
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: 'Falha ao exportar relatório.',
      life: 3000,
    })
  } finally {
    loading.value = false
    showScheduleModal.value = false
  }
}

const handleCreateCustomReport = async () => {
  if (!customReport.name || customReport.accounts.length === 0) {
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: 'Preencha o nome e selecione pelo menos uma conta',
      life: 3000,
    })
    return
  }
  loading.value = true
  try {
    // TODO: Implementar a chamada real da API para criar relatório personalizado
    // await api.post('/reports/custom', { customReport });
    toast.add({
      severity: 'success',
      summary: 'Sucesso',
      detail: 'Relatório personalizado criado com sucesso!',
      life: 3000,
    })
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: 'Falha ao exportar relatório.',
      life: 3000,
    })
  } finally {
    loading.value = false
    showCustomReportModal.value = false
  }
}

const addRecipient = () => {
  scheduleConfig.recipients.push('')
}

const removeRecipient = (index: number) => {
  if (scheduleConfig.recipients.length > 1) {
    scheduleConfig.recipients.splice(index, 1)
  }
}

const groupedReports = computed(() => {
  return reportTypes.value.reduce((groups: { [key: string]: typeof reportTypes.value }, report) => {
    if (!groups[report.category]) {
      groups[report.category] = []
    }
    groups[report.category].push(report)
    return groups
  }, {})
})
</script>

<template>
  <Toast />
  <div v-if="viewingReport">
    <ReportViewer
      :reportId="viewingReport.id"
      :reportTitle="viewingReport.title"
      @back="viewingReport = null"
    />
  </div>

  <main v-else class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2">
          <i class="pi pi-calendar"></i>
          <span class="font-medium">Período de Análise:</span>
        </div>
        <Dropdown
          v-model="selectedPeriod"
          :options="periodOptions"
          optionLabel="label"
          optionValue="value"
          class="w-48"
        />
      </div>

      <Button @click="showCustomReportModal = true">
        <i class="pi pi-filter mr-2"></i>
        Relatório Personalizado
      </Button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card v-for="(stat, index) in quickStats" :key="index">
        <template #title>
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium">{{ stat.title }}</span>
            <i :class="stat.icon" class="text-surface-500 dark:text-surface-400"></i>
          </div>
        </template>
        <template #content>
          <div class="text-2xl font-bold">
            {{
              stat.isPercentage
                ? `${stat.value}%`
                : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    stat.value,
                  )
            }}
          </div>
          <p class="text-xs text-surface-500 dark:text-surface-400">
            <span
              :class="[
                'inline-flex items-center',
                stat.trend === 'up' ? 'text-green-500' : 'text-red-500',
              ]"
            >
              <i :class="[stat.trend === 'up' ? 'pi pi-arrow-up' : 'pi pi-arrow-down', 'mr-1']"></i>
              {{ stat.change }}
            </span>
            desde o período anterior
          </p>
        </template>
      </Card>
    </div>

    <Card class="mb-8">
      <template #title>Indicadores de Saúde Financeira</template>
      <template #subtitle>Principais métricas da situação financeira atual</template>
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div class="space-y-3">
            <div class="flex justify-between items-center">
              <span class="text-sm font-medium">Liquidez Corrente</span>
              <span class="text-sm">0</span>
            </div>
            <ProgressBar :value="69" :showValue="false" style="height: 8px" />
            <p class="text-xs text-surface-500 dark:text-surface-400">
              Capacidade de pagamento de curto prazo
            </p>
          </div>
          <div class="space-y-3">
            <div class="flex justify-between items-center">
              <span class="text-sm font-medium">Margem Líquida</span>
              <span class="text-sm">0%</span>
            </div>
            <ProgressBar :value="74" :showValue="false" style="height: 8px" />
            <p class="text-xs text-surface-500 dark:text-surface-400">
              Percentual de lucro sobre receitas
            </p>
          </div>
          <div class="space-y-3">
            <div class="flex justify-between items-center">
              <span class="text-sm font-medium">Endividamento</span>
              <span class="text-sm">0%</span>
            </div>
            <ProgressBar :value="51" :showValue="false" style="height: 8px" />
            <p class="text-xs text-surface-500 dark:text-surface-400">
              Proporção de dívidas sobre ativos
            </p>
          </div>
        </div>
      </template>
    </Card>

    <div class="space-y-8">
      <div v-for="(reports, category) in groupedReports" :key="category">
        <h2 class="text-xl font-bold mb-4">{{ category }}</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <Card v-for="report in reports" :key="report.id">
            <template #header>
              <div class="flex items-start justify-between p-4">
                <div class="flex-1">
                  <h3 class="flex items-center gap-2 font-bold">
                    <i :class="report.icon" class="text-lg"></i>
                    {{ report.title }}
                  </h3>
                  <p class="text-sm text-surface-500 dark:text-surface-400 mt-1">
                    {{ report.description }}
                  </p>
                </div>
                <Tag severity="success" :value="report.status"></Tag>
              </div>
            </template>
            <template #content>
              <div class="space-y-4">
                <div class="text-sm text-surface-500 dark:text-surface-400">
                  <span>Última geração: {{ report.lastGenerated }}</span>
                </div>
                <div class="flex gap-2">
                  <Button
                    size="small"
                    class="flex-1"
                    @click="generateReport(report.id)"
                    :loading="loading"
                  >
                    <i class="pi pi-eye mr-1"></i>
                    Visualizar
                  </Button>
                  <Button
                    size="small"
                    severity="secondary"
                    outlined
                    @click="handleConfigureReport(report.id)"
                    :loading="loading"
                  >
                    <i class="pi pi-cog"></i>
                  </Button>
                  <Button
                    size="small"
                    severity="secondary"
                    outlined
                    @click="handleScheduleReport(report.id)"
                    :loading="loading"
                  >
                    <i class="pi pi-clock"></i>
                  </Button>
                  <Button
                    size="small"
                    severity="secondary"
                    outlined
                    @click="openExportModal(report.id)"
                    :loading="loading"
                  >
                    <i class="pi pi-download"></i>
                  </Button>
                </div>
              </div>
            </template>
          </Card>
        </div>
      </div>
    </div>

    <Dialog
      v-model:visible="showConfigModal"
      modal
      header="Configurar Relatório"
      :style="{ width: '40rem' }"
    >
      <div class="space-y-6 p-4">
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <label>Formato de Exportação</label>
            <Dropdown
              v-model="reportConfig.format"
              :options="['pdf', 'excel', 'csv']"
              class="w-full"
            />
          </div>
          <div class="space-y-2">
            <label>Orientação</label>
            <Dropdown
              v-model="reportConfig.orientation"
              :options="['portrait', 'landscape']"
              class="w-full"
            />
          </div>
        </div>
        <div class="space-y-2">
          <label>Nível de Detalhamento</label>
          <Dropdown
            v-model="reportConfig.detailLevel"
            :options="['summary', 'detailed', 'full']"
            class="w-full"
          />
        </div>
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <label>Incluir Gráficos</label>
            <InputSwitch v-model="reportConfig.includeGraphics" />
          </div>
          <div class="flex items-center justify-between">
            <label>Incluir Comparações</label>
            <InputSwitch v-model="reportConfig.includeComparisons" />
          </div>
          <div class="flex items-center justify-between">
            <label>Incluir Marca d'Água</label>
            <InputSwitch v-model="reportConfig.includeWatermark" />
          </div>
        </div>
        <div class="space-y-2">
          <label>Título Personalizado (opcional)</label>
          <InputText
            v-model="reportConfig.customTitle"
            placeholder="Ex: Relatório Gerencial - Agosto 2025"
            class="w-full"
          />
        </div>
        <div class="space-y-2">
          <label>Rodapé Personalizado (opcional)</label>
          <Textarea
            v-model="reportConfig.customFooter"
            placeholder="Ex: Gerado automaticamente pelo sistema FINVY"
            rows="2"
            class="w-full"
          />
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" severity="secondary" @click="showConfigModal = false" />
        <Button label="Salvar Configurações" @click="handleSaveConfig" :loading="loading" />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="showScheduleModal"
      modal
      header="Agendar Relatório"
      :style="{ width: '40rem' }"
    >
      <div class="space-y-6 p-4">
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <label>Frequência</label>
            <Dropdown
              v-model="scheduleConfig.frequency"
              :options="['weekly', 'monthly', 'quarterly', 'yearly']"
              class="w-full"
            />
          </div>
          <div class="space-y-2">
            <label>Horário</label>
            <InputText type="time" v-model="scheduleConfig.time" class="w-full" />
          </div>
        </div>
        <div v-if="scheduleConfig.frequency === 'weekly'" class="space-y-2">
          <label>Dia da Semana</label>
          <Dropdown
            v-model="scheduleConfig.dayOfWeek"
            :options="['monday', 'tuesday', 'wednesday', 'thursday', 'friday']"
            class="w-full"
          />
        </div>
        <div v-if="scheduleConfig.frequency === 'monthly'" class="space-y-2">
          <label>Dia do Mês</label>
          <Dropdown
            v-model="scheduleConfig.dayOfMonth"
            :options="Array.from({ length: 28 }, (_, i) => i + 1)"
            class="w-full"
          />
        </div>
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <label>Incluir Anexo</label>
            <InputSwitch v-model="scheduleConfig.includeAttachment" />
          </div>
          <div class="flex items-center justify-between">
            <label>Geração Automática</label>
            <InputSwitch v-model="scheduleConfig.autoGenerate" />
          </div>
        </div>
        <div class="space-y-3">
          <label>Destinatários</label>
          <div v-for="(_, index) in scheduleConfig.recipients" :key="index" class="flex gap-2">
            <InputText
              type="email"
              v-model="scheduleConfig.recipients[index]"
              placeholder="email@empresa.com"
              class="flex-1"
            />
            <Button
              v-if="scheduleConfig.recipients.length > 1"
              icon="pi pi-times"
              severity="danger"
              text
              rounded
              @click="removeRecipient(index)"
            />
          </div>
          <Button
            label="Adicionar Destinatário"
            severity="secondary"
            outlined
            class="w-full"
            @click="addRecipient"
          >
            <i class="pi pi-envelope mr-2"></i>
            Adicionar Destinatário
          </Button>
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" severity="secondary" @click="showScheduleModal = false" />
        <Button label="Configurar Agendamento" @click="handleSaveSchedule" :loading="loading" />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="showCustomReportModal"
      modal
      header="Criar Relatório Personalizado"
      :style="{ width: '50rem' }"
      contentClass="max-h-[90vh] overflow-y-auto"
    >
      <div class="space-y-6 p-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <label>Nome do Relatório *</label>
            <InputText
              v-model="customReport.name"
              placeholder="Ex: Relatório de Caixa Mensal"
              class="w-full"
            />
          </div>
          <div class="space-y-2">
            <label>Agrupar Por</label>
            <Dropdown
              v-model="customReport.groupBy"
              :options="['account', 'category', 'date', 'month']"
              class="w-full"
            />
          </div>
        </div>
        <div class="space-y-2">
          <label>Descrição</label>
          <Textarea
            v-model="customReport.description"
            placeholder="Descrição do relatório..."
            rows="2"
            class="w-full"
          />
        </div>
        <div class="space-y-3">
          <label>Contas Incluídas *</label>
          <div class="border rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
            <div
              v-for="account in availableAccounts"
              :key="account.value"
              class="flex items-center"
            >
              <Checkbox
                v-model="customReport.accounts"
                :inputId="account.value"
                :value="account.value"
              />
              <label :for="account.value" class="ml-2 text-sm">{{ account.label }}</label>
            </div>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <label>Data Inicial</label>
            <Calendar v-model="customReport.startDate" class="w-full" />
          </div>
          <div class="space-y-2">
            <label>Data Final</label>
            <Calendar v-model="customReport.endDate" class="w-full" />
          </div>
        </div>
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <label>Incluir Subcontas</label>
            <InputSwitch v-model="customReport.includeSubaccounts" />
          </div>
          <div class="flex items-center justify-between">
            <label>Mostrar Saldos Zero</label>
            <InputSwitch v-model="customReport.showZeroBalances" />
          </div>
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" severity="secondary" @click="showCustomReportModal = false" />
        <Button label="Criar Relatório" @click="handleCreateCustomReport" :loading="loading" />
      </template>
    </Dialog>
    <Dialog
      v-model:visible="showExportModal"
      modal
      header="Exportar Relatório"
      :style="{ width: '30rem' }"
    >
      <div class="space-y-6 p-4">
        <div class="space-y-2">
          <label>Formato</label>
          <Dropdown
            v-model="reportConfig.format"
            :options="['pdf', 'excel', 'csv']"
            class="w-full"
          />
        </div>
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <label>Incluir Gráficos</label>
            <InputSwitch v-model="reportConfig.includeGraphics" />
          </div>
          <div class="flex items-center justify-between">
            <label>Agrupar por conta</label>
            <InputSwitch v-model="reportConfig.includeComparisons" />
          </div>
          <div class="flex items-center justify-between">
            <label>Incluir detalhes completos</label>
            <InputSwitch v-model="reportConfig.includeWatermark" />
          </div>
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" severity="secondary" @click="showExportModal = false" />
        <Button label="Exportar" @click="handleExportReport" :loading="loading" />
      </template>
    </Dialog>
  </main>
</template>

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/services/api'
import type {
  LedgerAccount,
  ProductBalance,
  AccountsPayable,
  AccountsReceivable,
  BalanceSheet,
  CashFlow,
  IncomeStatement,
  InventoryReport,
  TrialBalance,
  ReportConfig,
  ReportSchedule,
  CustomReport,
} from '@/types/index'

interface ReportData {
  accountsPayable: AccountsPayable
  accountsReceivable: AccountsReceivable
  balanceSheet: BalanceSheet
  cashFlow: CashFlow
  incomeStatement: IncomeStatement
  inventory: InventoryReport
  trialBalance: TrialBalance
  ledgerAccounts: LedgerAccount[]
  stockBalances: ProductBalance[]
}

export const useReportStore = defineStore('report', () => {
  const reports = ref<ReportData | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  const reportConfigs = ref<ReportConfig[]>([])
  const scheduledReports = ref<ReportSchedule[]>([])

  async function fetchReports(startDate?: string, endDate?: string) {
    loading.value = true
    error.value = null
    try {
      const params: { startDate?: string; endDate?: string } = {}
      if (startDate) params.startDate = startDate
      if (endDate) params.endDate = endDate

      const data = await api.get<ReportData>('/reports/generate', { params })
      reports.value = data
    } catch (err: unknown) {
      console.error('Erro ao buscar relatórios:', err)
      if (err instanceof Error) {
        error.value = err.message || 'Falha ao buscar relatórios.'
      } else {
        error.value = 'Falha ao buscar relatórios.'
      }
    } finally {
      loading.value = false
    }
  }

  

  async function generateReport(reportId: string, config: ReportConfig) {
    loading.value = true
    error.value = null
    try {
      // This endpoint might need to be adjusted based on actual backend implementation
      const data = await api.post(`/reports/${reportId}/generate`, config)
      // Depending on the backend response, you might want to update a specific report in the store
      // For now, just log the success
      console.log(`Relatório ${reportId} gerado com sucesso:`, data)
    } catch (err: unknown) {
      console.error(`Erro ao gerar relatório ${reportId}:`, err)
      if (err instanceof Error) {
        error.value = err.message || `Falha ao gerar relatório ${reportId}.`
      } else {
        error.value = `Falha ao gerar relatório ${reportId}.`
      }
    } finally {
      loading.value = false
    }
  }

  async function saveReportConfig(reportId: string, config: ReportConfig) {
    loading.value = true
    error.value = null
    try {
      const data = await api.post(`/report-configs/${reportId}`, config)
      // Update the local state with the new config
      const index = reportConfigs.value.findIndex(rc => rc.reportId === reportId);
      if (index !== -1) {
        reportConfigs.value[index] = config;
      } else {
        reportConfigs.value.push(config);
      }
      console.log(`Configuração do relatório ${reportId} salva com sucesso:`, data)
    } catch (err: unknown) {
      console.error(`Erro ao salvar configuração do relatório ${reportId}:`, err)
      if (err instanceof Error) {
        error.value = err.message || `Falha ao salvar configuração do relatório ${reportId}.`
      } else {
        error.value = `Falha ao salvar configuração do relatório ${reportId}.`
      }
    } finally {
      loading.value = false
    }
  }

  async function scheduleReport(reportId: string, schedule: ReportSchedule) {
    loading.value = true
    error.value = null
    try {
      const data = await api.post(`/scheduled-reports/${reportId}`, schedule)
      // Update the local state with the new schedule
      const index = scheduledReports.value.findIndex(rs => rs.reportId === reportId);
      if (index !== -1) {
        scheduledReports.value[index] = schedule;
      } else {
        scheduledReports.value.push(schedule);
      }
      console.log(`Relatório ${reportId} agendado com sucesso:`, data)
    } catch (err: unknown) {
      console.error(`Erro ao agendar relatório ${reportId}:`, err)
      if (err instanceof Error) {
        error.value = err.message || `Falha ao agendar relatório ${reportId}.`
      } else {
        error.value = `Falha ao agendar relatório ${reportId}.`
      }
    } finally {
      loading.value = false
    }
  }

  async function createCustomReport(customReportData: CustomReport) {
    loading.value = true
    error.value = null
    try {
      const data = await api.post('/custom-reports', customReportData) // Assuming this endpoint exists
      console.log('Relatório personalizado criado com sucesso:', data)
    } catch (err: unknown) {
      console.error('Erro ao criar relatório personalizado:', err)
      if (err instanceof Error) {
        error.value = err.message || 'Falha ao criar relatório personalizado.'
      } else {
        error.value = 'Falha ao criar relatório personalizado.'
      }
    } finally {
      loading.value = false
    }
  }

  const accountsPayable = computed(() => reports.value?.accountsPayable)
  const accountsReceivable = computed(() => reports.value?.accountsReceivable)
  const balanceSheet = computed(() => reports.value?.balanceSheet)
  const cashFlow = computed(() => reports.value?.cashFlow)
  const incomeStatement = computed(() => reports.value?.incomeStatement)
  const inventory = computed(() => reports.value?.inventory)
  const trialBalance = computed(() => reports.value?.trialBalance)
  const stockBalances = computed(() => reports.value?.stockBalances || [])

  return {
    reports,
    loading,
    error,
    fetchReports,
    generateReport,
    saveReportConfig,
    scheduleReport,
    createCustomReport,
    accountsPayable,
    accountsReceivable,
    balanceSheet,
    cashFlow,
    incomeStatement,
    inventory,
    trialBalance,
    ledgerAccounts: computed(() => reports.value?.ledgerAccounts || []),
    stockBalances,
    reportConfigs: computed(() => reportConfigs.value),
    scheduledReports: computed(() => scheduledReports.value),
  }
})

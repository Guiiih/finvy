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

  const accountsPayable = computed(() => reports.value?.accountsPayable)
  const accountsReceivable = computed(() => reports.value?.accountsReceivable)
  const balanceSheet = computed(() => reports.value?.balanceSheet)
  const cashFlow = computed(() => reports.value?.cashFlow)
  const incomeStatement = computed(() => reports.value?.incomeStatement)
  const inventory = computed(() => reports.value?.inventory)
  const trialBalance = computed(() => reports.value?.trialBalance)
  const ledgerAccounts = computed<LedgerAccount[]>(() => reports.value?.ledgerAccounts || [])
  const stockBalances = computed(() => reports.value?.stockBalances || [])

  return {
    reports,
    loading,
    error,
    fetchReports,
    accountsPayable,
    accountsReceivable,
    balanceSheet,
    cashFlow,
    incomeStatement,
    inventory,
    trialBalance,
    ledgerAccounts,
    stockBalances,
  }
})

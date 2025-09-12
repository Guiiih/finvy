<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useReportStore } from '@/stores/reportStore'
import { useJournalEntryStore } from '@/stores/journalEntryStore'
import { useAccountStore } from '@/stores/accountStore'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Select from 'primevue/select'
import Checkbox from 'primevue/checkbox'
import OverlayPanel from 'primevue/overlaypanel'

interface ViewOption {
  value: 't-accounts' | 'detailed'
  label: string
}

interface LedgerEntry {
  id: string
  date: string
  reference: string
  description: string
  accountCode: string
  accountName: string
  debit: number
  credit: number
  balance: number
  entryType: 'opening' | 'transaction' | 'adjustment'
}



const reportStore = useReportStore()
const journalEntryStore = useJournalEntryStore()
const accountStore = useAccountStore()

const loading = ref(false)
const searchTerm = ref('')
const selectedPeriod = ref('current-month')
const startDate = ref('')
const endDate = ref('')
const currentView = ref<'t-accounts' | 'detailed'>('t-accounts') // 't-accounts' or 'detailed'

const periodOptions = [
  { value: 'current-month', label: 'Mês atual' },
  { value: 'last-month', label: 'Mês anterior' },
  { value: 'current-quarter', label: 'Trimestre atual' },
  { value: 'current-year', label: 'Ano atual' },
]

const viewOptions: ViewOption[] = [
  { value: 't-accounts', label: 'Simplificado' },
  { value: 'detailed', label: 'Detalhado' },
]

const showAdvancedFilterModal = ref(false)
const showEntryDetailModal = ref(false)
const showExportModal = ref(false)
const selectedEntry = ref<LedgerEntry | null>(null)

const opView = ref()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toggleViewFilter = (event: any) => {
  opView.value.toggle(event)
}
const opPeriod = ref()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const togglePeriodFilter = (event: any) => {
  opPeriod.value.toggle(event)
}

const advancedFilters = ref({
  entryTypes: ['opening', 'transaction', 'adjustment'],
  minAmount: 0,
  maxAmount: 0,
  includeZeroBalance: true,
  onlyDebits: false,
  onlyCredits: false,
  specificReferences: [] as string[],
  startDate: '',
  endDate: '',
  selectedAccount: 'all',
})

const availableAccounts = computed(() => {
  const accounts = accountStore.accounts.map((account) => ({
    value: account.code,
    label: `${account.code} - ${account.name}`,
  }))
  return [{ value: 'all', label: 'Todas as contas' }, ...accounts]
})

const exportConfig = ref({
  format: 'pdf',
  includeGraphics: true,
  groupByAccount: true,
  includeDetails: true,
  dateRange: 'filtered',
})

async function fetchLedgerData() {
  loading.value = true
  await reportStore.fetchReports(startDate.value, endDate.value)
  await journalEntryStore.fetchJournalEntries()
  loading.value = false
}

onMounted(async () => {
  const today = new Date()
  endDate.value = today.toISOString().split('T')[0]
  startDate.value = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0]
  await fetchLedgerData()
  await accountStore.fetchAccounts()
})

interface TAccountEntry {
  journalEntryId: string
  date: string
  description: string
  amount: number
  isDebit: boolean
}

interface TAccount {
  accountId: string
  accountName: string
  debitEntries: TAccountEntry[]
  creditEntries: TAccountEntry[]
  totalDebits: number
  totalCredits: number
  finalBalance: number
}

const allLedgerEntries = computed<LedgerEntry[]>(() => {
  const entries: LedgerEntry[] = []
  journalEntryStore.journalEntries.forEach((journalEntry) => {
    journalEntry.lines.forEach((line) => {
      const account = accountStore.getAccountById(line.account_id)
      if (account) {
        entries.push({
          id: journalEntry.id!,
          date: journalEntry.entry_date,
          reference: journalEntry.reference,
          description: journalEntry.description,
          accountCode: account.code,
          accountName: account.name,
          debit: line.type === 'debit' ? line.amount : 0,
          credit: line.type === 'credit' ? line.amount : 0,
          balance: 0,
          entryType: 'transaction',
        })
      }
    })
  })

  const balances: { [key: string]: number } = {}
  return entries
    .sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.id.localeCompare(b.id),
    )
    .map((entry) => {
      const accountKey = `${entry.accountCode}-${entry.accountName}`
      if (!balances[accountKey]) {
        balances[accountKey] = 0
      }
      balances[accountKey] += entry.debit - entry.credit
      return { ...entry, balance: balances[accountKey] }
    })
})

const filteredEntries = computed(() => {
  return allLedgerEntries.value.filter((entry) => {
    const entryDate = new Date(entry.date)
    const start = advancedFilters.value.startDate
      ? new Date(advancedFilters.value.startDate)
      : startDate.value
        ? new Date(startDate.value)
        : null
    const end = advancedFilters.value.endDate
      ? new Date(advancedFilters.value.endDate)
      : endDate.value
        ? new Date(endDate.value)
        : null

    if (start && entryDate < start) return false
    if (end && entryDate > end) return false

    const matchesSearch =
      entry.description.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      entry.reference.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      entry.accountName.toLowerCase().includes(searchTerm.value.toLowerCase())
    const matchesAccount =
      advancedFilters.value.selectedAccount === 'all' ||
      entry.accountCode === advancedFilters.value.selectedAccount

    // Advanced filters
    const matchesEntryType = advancedFilters.value.entryTypes.includes(entry.entryType)
    const matchesAmount =
      (!advancedFilters.value.minAmount ||
        entry.debit + entry.credit >= advancedFilters.value.minAmount) &&
      (!advancedFilters.value.maxAmount ||
        entry.debit + entry.credit <= advancedFilters.value.maxAmount)
    const matchesDebitCredit =
      (!advancedFilters.value.onlyDebits || entry.debit > 0) &&
      (!advancedFilters.value.onlyCredits || entry.credit > 0)

    return (
      matchesSearch && matchesAccount && matchesEntryType && matchesAmount && matchesDebitCredit
    )
  })
})

const groupedEntries = computed(() => {
  return filteredEntries.value.reduce((groups: { [key: string]: LedgerEntry[] }, entry) => {
    const key = `${entry.accountCode}-${entry.accountName}`
    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(entry)
    return groups
  }, {})
})

const tAccounts = computed<TAccount[]>(() => {
  const accountsMap = new Map<string, TAccount>()

  filteredEntries.value.forEach((entry) => {
    const account = accountStore.accounts.find((acc) => acc.code === entry.accountCode)
    if (!account) return

    if (!accountsMap.has(account.id)) {
      accountsMap.set(account.id, {
        accountId: account.id,
        accountName: account.name,
        debitEntries: [],
        creditEntries: [],
        totalDebits: 0,
        totalCredits: 0,
        finalBalance: 0,
      })
    }

    const tAccount = accountsMap.get(account.id)!
    const entryDetail: TAccountEntry = {
      journalEntryId: entry.id!,
      date: entry.date,
      description: entry.description,
      amount: entry.debit > 0 ? entry.debit : entry.credit,
      isDebit: entry.debit > 0,
    }

    if (entry.debit > 0) {
      tAccount.debitEntries.push(entryDetail)
      tAccount.totalDebits += entry.debit
    } else {
      tAccount.creditEntries.push(entryDetail)
      tAccount.totalCredits += entry.credit
    }
  })

  accountsMap.forEach((tAccount) => {
    const accountType = accountStore.getAccountById(tAccount.accountId)?.type
    if (accountType === 'asset' || accountType === 'expense') {
      tAccount.finalBalance = tAccount.totalDebits - tAccount.totalCredits
    } else {
      tAccount.finalBalance = tAccount.totalCredits - tAccount.totalDebits
    }
  })

  return Array.from(accountsMap.values()).sort((a, b) => a.accountName.localeCompare(b.accountName))
})

function getBalanceClass(account: TAccount) {
  if (account.finalBalance === 0) {
    return ''
  }

  const accountType = accountStore.getAccountById(account.accountId)?.type

  if (account.accountName === 'Resultado Bruto') {
    return account.finalBalance >= 0 ? 'positive' : 'negative'
  }

  if (account.accountName === 'Estoque Final') {
    return account.finalBalance >= 0 ? 'positive' : 'negative'
  }

  if (account.accountName === 'CMV') {
    return account.finalBalance > 0 ? 'positive' : ''
  }

  if (account.accountName === 'Reserva de Lucro') {
    return account.finalBalance >= 0 ? 'positive' : 'negative'
  }

  const isDebitNature = ['asset', 'expense'].includes(accountType || '')

  if (isDebitNature) {
    return account.finalBalance >= 0 ? 'positive' : 'negative'
  } else {
    return account.finalBalance >= 0 ? 'positive' : 'negative'
  }
}

function openEntryDetail(entry: LedgerEntry) {
  selectedEntry.value = entry
  showEntryDetailModal.value = true
}

const exportLedger = async () => {
  loading.value = true
  await new Promise((resolve) => setTimeout(resolve, 1500))
  loading.value = false
  showExportModal.value = false
  alert(`Relatório do razão exportado em ${exportConfig.value.format.toUpperCase()}!`)
}

const applyAdvancedFilters = () => {
  showAdvancedFilterModal.value = false
  // The filtering is now done in the computed property
}

const clearAdvancedFilters = () => {
  advancedFilters.value = {
    entryTypes: ['opening', 'transaction', 'adjustment'],
    minAmount: 0,
    maxAmount: 0,
    includeZeroBalance: true,
    onlyDebits: false,
    onlyCredits: false,
    specificReferences: [] as string[],
    startDate: '',
    endDate: '',
    selectedAccount: 'all',
  }
}

const getEntryTypeColor = (type: string) => {
  switch (type) {
    case 'opening':
      return 'bg-blue-100 text-blue-800'
    case 'transaction':
      return 'bg-green-100 text-green-800'
    case 'adjustment':
      return 'bg-yellow-100 text-yellow-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getEntryTypeLabel = (type: string) => {
  switch (type) {
    case 'opening':
      return 'Saldo Inicial'
    case 'transaction':
      return 'Transação'
    case 'adjustment':
      return 'Ajuste'
    default:
      return type
  }
}
</script>

<template>
  <div>
    <div class="max-w-7xl mx-auto">
      <div class="flex flex-wrap items-center gap-4 mb-6">
        <div class="relative flex-1">
          <i
            class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 transform text-surface-400"
            style="font-size: 15px"
          ></i>
          <input
            type="text"
            v-model="searchTerm"
            @input="fetchLedgerData"
            placeholder="Buscar por descrição, referência ou conta..."
            class="w-full rounded-lg border border-surface-300 py-1 pl-10 pr-4 focus:border-transparent focus:outline-none focus:ring-1 focus:ring-zinc-950 placeholder:text-sm"
          />
        </div>

        <!-- Mobile Icon Buttons -->
        <div class="flex sm:hidden gap-2">
          <Button severity="secondary" @click="toggleViewFilter" size="small">
            <span class="material-symbols-outlined">swap_vert</span>
          </Button>
          <Button
            icon="pi pi-calendar"
            severity="secondary"
            @click="togglePeriodFilter"
            size="small"
          />
        </div>

        <!-- Desktop Selects -->
        <div class="hidden sm:flex items-center gap-4">
          <Select
            v-model="currentView"
            :options="viewOptions"
            optionLabel="label"
            optionValue="value"
            size="small"
          />

          <Select
            v-model="selectedPeriod"
            :options="periodOptions"
            @change="fetchLedgerData"
            optionLabel="label"
            optionValue="value"
            placeholder="Selecione o período"
            size="small"
          />
        </div>

        <Button
          icon="pi pi-cog"
          @click="showAdvancedFilterModal = true"
          severity="secondary"
          size="small"
        />
        <Button
          icon="pi pi-upload"
          @click="showExportModal = true"
          :disabled="loading"
          severity="secondary"
          size="small"
        />
      </div>

      <OverlayPanel ref="opView">
        <div
          v-for="opt in viewOptions"
          :key="opt.value"
          @click="
            currentView = opt.value;
            opView.hide();
          "
          class="p-2 hover:bg-surface-100 cursor-pointer"
        >
          {{ opt.label }}
        </div>
      </OverlayPanel>
      <OverlayPanel ref="opPeriod">
        <div
          v-for="opt in periodOptions"
          :key="opt.value"
          @click="
            selectedPeriod = opt.value;
            opPeriod.hide();
            fetchLedgerData();
          "
          class="p-2 hover:bg-surface-100 cursor-pointer"
        >
          {{ opt.label }}
        </div>
      </OverlayPanel>

      <div v-if="currentView === 't-accounts'">
        <div
          v-if="!journalEntryStore.journalEntries || journalEntryStore.journalEntries.length === 0"
          class="text-center py-12"
        >
          <p class="text-gray-600">Nenhum lançamento contábil registrado ainda.</p>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <div
            v-for="account in tAccounts"
            :key="account.accountId"
            class="bg-surface-50 p-0 rounded-lg shadow-md flex flex-col overflow-hidden"
          >
            <h3
              class="bg-surface-100 p-3 text-center text-surface-700 font-semibold text-lg border-b border-surface-200"
            >
              {{ account.accountName }}
            </h3>
            <div class="relative flex-grow p-3">
              <div class="t-account-wrapper">
                <div class="t-side debit-side">
                  <ul>
                    <li
                      v-for="(entry, index) in account.debitEntries"
                      :key="index"
                      :title="`Data: ${entry.date}\nDescrição: ${entry.description}`"
                    >
                      <span class="font-mono text-surface-800"
                        >R$ {{ entry.amount.toFixed(2) }}</span
                      >
                    </li>
                  </ul>
                </div>
                <div class="t-side credit-side">
                  <ul>
                    <li
                      v-for="(entry, index) in account.creditEntries"
                      :key="index"
                      :title="`Data: ${entry.date}\nDescrição: ${entry.description}`"
                    >
                      <span class="font-mono text-surface-800"
                        >R$ {{ entry.amount.toFixed(2) }}</span
                      >
                    </li>
                  </ul>
                </div>
              </div>

              <div
                class="flex justify-between font-bold text-sm py-2 border-t border-surface-200 mt-2"
              >
                <div class="text-emerald-600">R$ {{ account.totalDebits.toFixed(2) }}</div>
                <div class="text-blue-600">R$ {{ account.totalCredits.toFixed(2) }}</div>
              </div>

              <div class="flex justify-between font-bold text-base py-2">
                <div
                  :class="{
                    'text-emerald-600': getBalanceClass(account) === 'positive',
                    'text-red-600': getBalanceClass(account) === 'negative',
                  }"
                  v-if="
                    (account.finalBalance !== 0 &&
                      ((['asset', 'expense'].includes(
                        accountStore.getAccountById(account.accountId)?.type || '',
                      ) &&
                        account.finalBalance >= 0) ||
                        (!['asset', 'expense'].includes(
                          accountStore.getAccountById(account.accountId)?.type || '',
                        ) &&
                          account.finalBalance < 0))) ||
                    (account.accountName === 'Resultado Bruto' && account.finalBalance < 0) ||
                    (account.accountName === 'Estoque Final' && account.finalBalance >= 0) ||
                    (account.accountName === 'CMV' && account.finalBalance >= 0) ||
                    (account.accountName === 'Reserva de Lucro' && account.finalBalance < 0)
                  "
                >
                  R$ {{ Math.abs(account.finalBalance).toFixed(2) }}
                </div>
                <div v-else></div>

                <div
                  :class="{
                    'text-emerald-600': getBalanceClass(account) === 'positive',
                    'text-red-600': getBalanceClass(account) === 'negative',
                  }"
                  v-if="
                    account.finalBalance !== 0 &&
                    ((!['asset', 'expense'].includes(
                      accountStore.getAccountById(account.accountId)?.type || '',
                    ) &&
                      account.finalBalance >= 0) ||
                      (account.accountName === 'Resultado Bruto' && account.finalBalance >= 0) ||
                      (account.accountName === 'Estoque Final' && account.finalBalance < 0) ||
                      (account.accountName === 'CMV' && account.finalBalance < 0) ||
                      (account.accountName === 'Reserva de Lucro' && account.finalBalance >= 0) ||
                      (['asset', 'expense'].includes(
                        accountStore.getAccountById(account.accountId)?.type || '',
                      ) &&
                        account.finalBalance < 0))
                  "
                >
                  R$ {{ Math.abs(account.finalBalance).toFixed(2) }}
                </div>
                <div v-else></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else-if="currentView === 'detailed'">
        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <!-- Ledger Entries by Account -->
          <div class="space-y-6" v-if="Object.keys(groupedEntries).length > 0">
            <div
              v-for="[accountKey, entries] in Object.entries(groupedEntries)"
              :key="accountKey"
              class="bg-white p-0 rounded-lg shadow-md"
            >
              <div class="p-6">
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="text-xl font-semibold text-gray-900 flex items-center gap-2">
                      <span class="mr-2">📄</span>
                      {{ accountKey.split('-')[0] }} - {{ accountKey.split('-')[1] }}
                    </h3>
                    <p class="text-gray-600">{{ entries.length }} movimentações no período</p>
                  </div>
                  <div class="text-right">
                    <div class="text-sm text-gray-600">Saldo Final</div>
                    <div class="font-bold text-lg">
                      {{ 
                        (entries[entries.length - 1]?.balance || 0).toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })
                      }}
                    </div>
                  </div>
                </div>
              </div>
              <div class="border-t border-gray-200 overflow-hidden">
                <div
                  class="bg-gray-50 grid grid-cols-9 gap-4 p-3 text-sm font-medium border-b border-gray-200"
                >
                  <span>Data</span>
                  <span>Referência</span>
                  <span class="col-span-2">Descrição</span>
                  <span class="text-right">Débito</span>
                  <span class="text-right">Crédito</span>
                  <span class="text-right">Saldo</span>
                  <span class="text-center">Tipo</span>
                  <span class="text-center">Ações</span>
                </div>

                <div
                  v-for="entry in entries"
                  :key="entry.id"
                  class="grid grid-cols-9 gap-4 p-3 border-b border-gray-200 last:border-b-0 hover:bg-gray-50"
                >
                  <span class="text-sm">
                    {{ new Date(entry.date).toLocaleDateString('pt-BR') }}
                  </span>
                  <span class="text-sm font-mono">{{ entry.reference }}</span>
                  <span class="col-span-2 text-sm">{{ entry.description }}</span>
                  <span class="text-right text-sm font-medium">
                    {{ 
                      entry.debit > 0
                        ? entry.debit.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })
                        : '-'
                    }}
                  </span>
                  <span class="text-right text-sm font-medium">
                    {{ 
                      entry.credit > 0
                        ? entry.credit.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })
                        : '-'
                    }}
                  </span>
                  <span class="text-right text-sm font-medium">
                    {{ 
                      entry.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                    }}
                  </span>
                  <div class="text-center">
                    <span
                      :class="`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEntryTypeColor(entry.entryType)}`"
                    >
                      {{ getEntryTypeLabel(entry.entryType) }}
                    </span>
                  </div>
                  <div class="text-center">
                    <Button label="Detalhes" text size="small" @click="openEntryDetail(entry)" />
                  </div>
                </div>

                <div
                  class="bg-gray-50 grid grid-cols-9 gap-4 p-3 font-medium border-t border-gray-200"
                >
                  <span class="col-span-4 text-right">TOTAIS:</span>
                  <span class="text-right">
                    {{ 
                      filteredEntries
                        .reduce((sum, entry) => sum + entry.debit, 0)
                        .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                    }}
                  </span>
                  <span class="text-right">
                    {{ 
                      filteredEntries
                        .reduce((sum, entry) => sum + entry.credit, 0)
                        .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                    }}
                  </span>
                  <span class="text-right font-bold">
                    {{ 
                      (entries[entries.length - 1]?.balance || 0).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })
                    }}
                  </span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>

          <div v-if="Object.keys(groupedEntries).length === 0" class="text-center py-12">
            <p class="text-gray-600">Nenhum lançamento contábil registrado ainda.</p>
          </div>
        </main>
      </div>

      <!-- Modals -->
      <Dialog
        v-model:visible="showAdvancedFilterModal"
        modal
        header="Filtros Avançados"
        :style="{ width: '50rem' }"
      >
        <div class="mt-6 space-y-6">
          <div class="space-y-2">
            <label class="text-sm font-medium">Conta</label>
            <Select
              v-model="advancedFilters.selectedAccount"
              :options="availableAccounts"
              optionLabel="label"
              optionValue="value"
              placeholder="Todas as contas"
              class="w-full"
              size="small"
            />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-sm font-medium">Data Inicial</label>
              <input
                type="date"
                v-model="advancedFilters.startDate"
                class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium">Data Final</label>
              <input
                type="date"
                v-model="advancedFilters.endDate"
                class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
          </div>
          <div class="space-y-3">
            <label class="text-sm font-medium text-gray-700">Tipos de Lançamento</label>
            <div class="space-y-2">
              <div
                v-for="type in [
                  { value: 'opening', label: 'Saldo Inicial' },
                  { value: 'transaction', label: 'Transação' },
                  { value: 'adjustment', label: 'Ajuste' },
                ]"
                :key="type.value"
                class="flex items-center space-x-2"
              >
                <Checkbox
                  v-model="advancedFilters.entryTypes"
                  :inputId="type.value"
                  name="type"
                  :value="type.value"
                />
                <label :for="type.value" class="text-sm font-medium text-gray-700">{{ 
                  type.label
                }}</label>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-sm font-medium text-gray-700">Valor Mínimo (R$)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                v-model.number="advancedFilters.minAmount"
                class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>

            <div class="space-y-2">
              <label class="text-sm font-medium text-gray-700">Valor Máximo (R$)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                v-model.number="advancedFilters.maxAmount"
                class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
          </div>

          <div class="space-y-4">
            <div class="flex items-center space-x-2">
              <Checkbox
                v-model="advancedFilters.includeZeroBalance"
                inputId="includeZeroBalance"
                binary
              />
              <label for="includeZeroBalance" class="text-sm font-medium text-gray-700"
                >Incluir saldos zerados</label
              >
            </div>

            <div class="flex items-center space-x-2">
              <Checkbox v-model="advancedFilters.onlyDebits" inputId="onlyDebits" binary />
              <label for="onlyDebits" class="text-sm font-medium text-gray-700"
                >Apenas débitos</label
              >
            </div>

            <div class="flex items-center space-x-2">
              <Checkbox v-model="advancedFilters.onlyCredits" inputId="onlyCredits" binary />
              <label for="onlyCredits" class="text-sm font-medium text-gray-700"
                >Apenas créditos</label
              >
            </div>
          </div>
        </div>
        <template #footer>
          <Button label="Limpar Filtros" text @click="clearAdvancedFilters" />
          <Button label="Cancelar" text @click="showAdvancedFilterModal = false" />
          <Button label="Aplicar Filtros" @click="applyAdvancedFilters" />
        </template>
      </Dialog>

      <Dialog
        v-model:visible="showEntryDetailModal"
        modal
        header="Detalhes do Lançamento"
        :style="{ width: '50rem' }"
      >
        <div v-if="selectedEntry" class="mt-6 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium text-gray-700">Data</label>
              <p class="text-sm mt-1">
                {{ new Date(selectedEntry.date).toLocaleDateString('pt-BR') }}
              </p>
            </div>

            <div>
              <label class="text-sm font-medium text-gray-700">Referência</label>
              <p class="text-sm mt-1 font-mono">{{ selectedEntry.reference }}</p>
            </div>
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700">Conta Contábil</label>
            <p class="text-sm mt-1">
              {{ selectedEntry.accountCode }} - {{ selectedEntry.accountName }}
            </p>
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700">Descrição</label>
            <p class="text-sm mt-1">{{ selectedEntry.description }}</p>
          </div>

          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="text-sm font-medium text-gray-700">Débito</label>
              <p class="text-sm mt-1 font-medium text-green-600">
                {{ 
                  selectedEntry.debit > 0
                    ? selectedEntry.debit.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })
                    : '-'
                }}
              </p>
            </div>

            <div>
              <label class="text-sm font-medium text-gray-700">Crédito</label>
              <p class="text-sm mt-1 font-medium text-red-600">
                {{ 
                  selectedEntry.credit > 0
                    ? selectedEntry.credit.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })
                    : '-'
                }}
              </p>
            </div>

            <div>
              <label class="text-sm font-medium text-gray-700">Saldo</label>
              <p class="text-sm mt-1 font-bold">
                {{ 
                  selectedEntry.balance.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })
                }}
              </p>
            </div>
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700">Tipo de Lançamento</label>
            <div class="mt-1">
              <span
                :class="`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium`"
              >
                {{ selectedEntry.entryType }}
              </span>
            </div>
          </div>
        </div>
        <template #footer>
          <Button label="Fechar" @click="showEntryDetailModal = false" />
        </template>
      </Dialog>

      <Dialog
        v-model:visible="showExportModal"
        modal
        header="Exportar Livro Razão"
        :style="{ width: '30rem' }"
      >
        <div class="mt-6 space-y-4">
          <div class="space-y-2">
            <label class="text-sm font-medium text-gray-700">Formato</label>
            <select
              v-model="exportConfig.format"
              class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
              <option value="csv">CSV</option>
            </select>
          </div>

          <div class="space-y-4">
            <div class="flex items-center space-x-2">
              <Checkbox v-model="exportConfig.includeGraphics" inputId="includeGraphics" binary />
              <label for="includeGraphics" class="text-sm font-medium text-gray-700"
                >Incluir gráficos</label
              >
            </div>

            <div class="flex items-center space-x-2">
              <Checkbox v-model="exportConfig.groupByAccount" inputId="groupByAccount" binary />
              <label for="groupByAccount" class="text-sm font-medium text-gray-700"
                >Agrupar por conta</label
              >
            </div>

            <div class="flex items-center space-x-2">
              <Checkbox v-model="exportConfig.includeDetails" inputId="includeDetails" binary />
              <label for="includeDetails" class="text-sm font-medium text-gray-700"
                >Incluir detalhes completos</label
              >
            </div>
          </div>
        </div>
        <template #footer>
          <Button label="Cancelar" text @click="showExportModal = false" />
          <Button label="Exportar" @click="exportLedger" :loading="loading" />
        </template>
      </Dialog>
    </div>
  </div>
</template>

<style scoped>
.t-account-wrapper {
  display: grid;
  grid-template-columns: 1fr 1fr;
  position: relative;
}

.t-account-wrapper::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 1px;
  background-color: #e0e0e0;
  transform: translateX(-50%);
}

.t-side ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.t-side li {
  padding: 2px 0;
  font-size: 0.95rem;
  color: #333;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 5px;
  border-bottom: 1px dotted #eee;
  padding-bottom: 5px;
}

.t-side li:last-child {
  border-bottom: none;
}

.t-side.debit-side {
  padding-right: 10px; /* Espaçamento para a linha central */
}

.t-side.credit-side {
  padding-left: 10px; /* Espaçamento para a linha central */
}
</style>
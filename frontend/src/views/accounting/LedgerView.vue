<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useReportStore } from '@/stores/reportStore'
import { useJournalEntryStore } from '@/stores/journalEntryStore'
import { useAccountStore } from '@/stores/accountStore'

const reportStore = useReportStore()
const journalEntryStore = useJournalEntryStore()
const accountStore = useAccountStore()

const startDate = ref('')
const endDate = ref('')

async function fetchLedgerData() {
  await reportStore.fetchReports(startDate.value, endDate.value)
  await journalEntryStore.fetchJournalEntries()
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

const tAccounts = computed<TAccount[]>(() => {
  const accountsMap = new Map<string, TAccount>()

  journalEntryStore.journalEntries.forEach((entry) => {
    entry.lines.forEach((line) => {
      const account = accountStore.getAccountById(line.account_id)
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
        date: entry.entry_date,
        description: entry.description,
        amount: line.amount,
        isDebit: line.type === 'debit',
      }

      if (line.type === 'debit') {
        tAccount.debitEntries.push(entryDetail)
        tAccount.totalDebits += line.amount
      } else {
        tAccount.creditEntries.push(entryDetail)
        tAccount.totalCredits += line.amount
      }
    })
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
</script>

<template>
  <div>
    <div class="max-w-7xl mx-auto">
      <h1 class="text-3xl font-bold text-surface-800 mb-6 text-center">Razão (Ledger)</h1>

      <div class="mb-6 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
        <div class="flex-grow">
          <label for="startDate" class="text-surface-700 font-medium mb-1">Data Inicial:</label>
          <input
            type="date"
            id="startDate"
            v-model="startDate"
            @change="fetchLedgerData"
            class="w-full p-3 border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </div>
        <div class="flex-grow">
          <label for="endDate" class="text-surface-700 font-medium mb-1">Data Final:</label>
          <input
            type="date"
            id="endDate"
            v-model="endDate"
            @change="fetchLedgerData"
            class="w-full p-3 border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </div>
      </div>

      <p
        v-if="!journalEntryStore.journalEntries || journalEntryStore.journalEntries.length === 0"
        class="text-surface-400 text-center p-8"
      >
        Nenhum lançamento contábil registrado ainda. Por favor, adicione lançamentos na tela
        "Lançamentos Contábeis" para ver o Razão.
      </p>

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
                    <span class="font-mono text-surface-800">R$ {{ entry.amount.toFixed(2) }}</span>
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
                    <span class="font-mono text-surface-800">R$ {{ entry.amount.toFixed(2) }}</span>
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

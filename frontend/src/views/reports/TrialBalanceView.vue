<template>
  <div class="p-4 sm:p-6 max-w-7xl mx-auto">
    <h1 class="text-2xl font-bold mb-4 text-center text-surface-800">Balancete de Verificação</h1>

    <p
      v-if="reportStore.loading"
      class="text-center p-4 bg-surface-100 border border-surface-200 rounded-lg text-surface-600 italic mt-4"
    >
      Carregando balancete...
    </p>
    <p
      v-else-if="reportStore.error"
      class="text-center p-4 bg-red-100 border border-red-200 rounded-lg text-red-700 mt-4"
    >
      Erro ao carregar balancete: {{ reportStore.error }}
    </p>
    <p
      v-else-if="reportStore.trialBalanceData.length === 0"
      class="text-center p-4 bg-surface-100 border border-surface-200 rounded-lg text-surface-600 italic mt-4"
    >
      Nenhum dado de balancete para exibir. Adicione lançamentos contábeis.
    </p>
    <div v-else class="overflow-x-auto bg-white rounded-lg shadow-md">
      <table class="min-w-full divide-y divide-surface-200">
        <thead class="bg-surface-100">
          <tr>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider"
            >
              Conta
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider"
            >
              Tipo
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider"
            >
              Débito
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider"
            >
              Crédito
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider"
            >
              Saldo Final
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-surface-200">
          <tr v-for="account in reportStore.trialBalanceData" :key="account.account_id">
            <td class="px-6 py-4 whitespace-nowrap text-sm text-surface-900">
              {{ account.accountName }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-surface-900">{{ account.type }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-surface-900">
              R$ {{ account.totalDebits.toFixed(2) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-surface-900">
              R$ {{ account.totalCredits.toFixed(2) }}
            </td>
            <td
              class="px-6 py-4 whitespace-nowrap text-sm"
              :class="{
                'text-emerald-600': account.finalBalance >= 0,
                'text-red-600': account.finalBalance < 0,
              }"
            >
              R$ {{ account.finalBalance.toFixed(2) }}
            </td>
          </tr>
        </tbody>
        <tfoot class="bg-surface-100">
          <tr>
            <td
              colspan="2"
              class="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider"
            >
              Totais
            </td>
            <td
              class="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider"
            >
              R$ {{ totalDebitsBalance.toFixed(2) }}
            </td>
            <td
              class="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider"
            >
              R$ {{ totalCreditsBalance.toFixed(2) }}
            </td>
            <td
              class="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider"
            >
              R$ {{ (totalDebitsBalance - totalCreditsBalance).toFixed(2) }}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useReportStore } from '@/stores/reportStore'

const props = defineProps<{
  startDate: string
  endDate: string
  reportType?: string
}>()

const reportStore = useReportStore()

async function fetchTrialBalanceData() {
  await reportStore.fetchTrialBalance(props.startDate, props.endDate)
}

watch(
  [() => props.startDate, () => props.endDate],
  () => {
    fetchTrialBalanceData()
  },
  { immediate: true },
)

const totalDebitsBalance = computed(() => {
  return reportStore.trialBalanceData.reduce((sum, account) => sum + account.totalDebits, 0)
})

const totalCreditsBalance = computed(() => {
  return reportStore.trialBalanceData.reduce((sum, account) => sum + account.totalCredits, 0)
})
</script>

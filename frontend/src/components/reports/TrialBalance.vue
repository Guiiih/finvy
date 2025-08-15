<script setup lang="ts">
import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { computed } from 'vue'
import { useReportStore } from '@/stores/reportStore'

const reportStore = useReportStore()

const trialBalanceData = computed(() => reportStore.trialBalance)

// Função para formatar valores monetários
const formatCurrency = (value: number) => {
  const options: Intl.NumberFormatOptions = { style: 'currency', currency: 'BRL' }
  return new Intl.NumberFormat('pt-BR', options).format(value)
}

// Propriedades computadas para totais
const totalDebits = computed(
  () => trialBalanceData.value?.accounts.reduce((sum, acc) => sum + (acc.debit || 0), 0) || 0,
)
const totalCredits = computed(
  () => trialBalanceData.value?.accounts.reduce((sum, acc) => sum + (acc.credit || 0), 0) || 0,
)
const totalBalance = computed(
  () => trialBalanceData.value?.accounts.reduce((sum, acc) => sum + acc.balance, 0) || 0,
)
</script>

<template>
  <div v-if="trialBalanceData" class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
    <Card class="text-center">
      <template #title>Total Débitos</template>
      <template #content>
        <p class="text-2xl font-bold text-blue-500">
          {{ formatCurrency(trialBalanceData.summary.totalDebits) }}
        </p>
      </template>
    </Card>
    <Card class="text-center">
      <template #title>Total Créditos</template>
      <template #content>
        <p class="text-2xl font-bold text-orange-500">
          {{ formatCurrency(trialBalanceData.summary.totalCredits) }}
        </p>
      </template>
    </Card>
    <Card class="text-center">
      <template #title>Diferença</template>
      <template #content>
        <p
          class="text-2xl font-bold"
          :class="trialBalanceData.summary.difference === 0 ? 'text-green-500' : 'text-red-500'"
        >
          {{ formatCurrency(trialBalanceData.summary.difference) }}
        </p>
      </template>
    </Card>
  </div>

  <Card v-if="trialBalanceData">
    <template #title>Balancete de Verificação</template>
    <template #subtitle>Lista de todas as contas com seus respectivos saldos</template>
    <template #content>
      <DataTable :value="trialBalanceData.accounts" responsiveLayout="scroll">
        <Column field="code" header="Código"></Column>
        <Column field="name" header="Conta"></Column>
        <Column field="type" header="Tipo"></Column>
        <Column field="debit" header="Débito">
          <template #body="{ data }">
            {{ data.debit ? formatCurrency(data.debit) : '-' }}
          </template>
        </Column>
        <Column field="credit" header="Crédito">
          <template #body="{ data }">
            {{ data.credit ? formatCurrency(data.credit) : '-' }}
          </template>
        </Column>
        <Column field="balance" header="Saldo">
          <template #body="{ data }">
            <span :class="data.balance >= 0 ? 'text-green-500' : 'text-red-500'">
              {{ formatCurrency(data.balance) }}
            </span>
          </template>
        </Column>
        <template #footer>
          <div class="grid grid-cols-6 font-bold">
            <div class="col-span-3">TOTAIS</div>
            <div>{{ formatCurrency(totalDebits) }}</div>
            <div>{{ formatCurrency(totalCredits) }}</div>
            <div :class="totalBalance >= 0 ? 'text-green-500' : 'text-red-500'">
              {{ formatCurrency(totalBalance) }}
            </div>
          </div>
        </template>
      </DataTable>
    </template>
  </Card>
</template>

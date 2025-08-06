<script setup lang="ts">
import { defineAsyncComponent, computed, ref } from 'vue'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Dropdown from 'primevue/dropdown'

const props = defineProps<{
  reportId: string
  reportTitle: string
}>()

const emit = defineEmits(['back'])

const goBack = () => {
  emit('back')
}

const selectedPeriod = ref('current-month')
const periodOptions = [
  { value: 'current-month', label: 'Mês atual' },
  { value: 'last-month', label: 'Mês anterior' },
  { value: 'current-quarter', label: 'Trimestre atual' },
  { value: 'current-year', label: 'Ano atual' },
  { value: 'last-year', label: 'Ano anterior' },
]

const reportComponent = computed(() => {
  switch (props.reportId) {
    case 'balance-sheet':
      return defineAsyncComponent(() => import('./BalanceSheet.vue'))
    case 'income-statement':
      return defineAsyncComponent(() => import('./IncomeStatement.vue'))
    case 'cash-flow':
      return defineAsyncComponent(() => import('./CashFlow.vue'))
    case 'trial-balance':
      return defineAsyncComponent(() => import('./TrialBalance.vue'))
    case 'accounts-receivable':
      return defineAsyncComponent(() => import('./AccountsReceivable.vue'))
    case 'accounts-payable':
      return defineAsyncComponent(() => import('./AccountsPayable.vue'))
    case 'inventory-report':
      return defineAsyncComponent(() => import('./InventoryReport.vue'))
    default:
      return null
  }
})
</script>

<template>
  <div class="p-4 sm:p-6">
    <div class="flex justify-between items-center mb-4">
      <div>
        <Button @click="goBack" text class="p-button-secondary">
          <i class="pi pi-arrow-left mr-2"></i>
          Voltar para Relatórios
        </Button>
        <h1 class="text-2xl font-bold">{{ reportTitle }}</h1>
        <p class="text-surface-500">Período: Agosto 2025</p>
      </div>
      <div class="flex items-center gap-2">
        <Dropdown
          v-model="selectedPeriod"
          :options="periodOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Selecione o Período"
        />
        <Button icon="pi pi-upload" severity="secondary" text rounded />
        <Button icon="pi pi-print" severity="secondary" text rounded />
        <Button icon="pi pi-download" severity="secondary" text rounded />
      </div>
    </div>

    <div v-if="reportComponent">
      <component :is="reportComponent" />
    </div>
    <div v-else>
      <Card>
        <template #content>
          <p>
            Relatório selecionado '{{ reportId }}' não possui um componente de visualização
            definido.
          </p>
        </template>
      </Card>
    </div>
  </div>
</template>

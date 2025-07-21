<script setup lang="ts">
import { computed, watch } from 'vue'
import { useReportStore } from '@/stores/reportStore'
import { useJournalEntryStore } from '@/stores/journalEntryStore'

const props = defineProps<{
  startDate: string
  endDate: string
  reportType?: string
}>()

const reportStore = useReportStore()
const journalEntryStore = useJournalEntryStore()

async function fetchDREData() {
  await reportStore.fetchReports(props.startDate, props.endDate)
}

watch(
  [() => props.startDate, () => props.endDate],
  () => {
    fetchDREData()
  },
  { immediate: true },
)

const dreData = computed(() => reportStore.dreData)
</script>

<template>
  <div class="p-4 sm:p-6 max-w-7xl mx-auto bg-white rounded-lg shadow-md">
    <h1 class="text-2xl font-bold mb-4 text-center text-surface-800 border-b pb-2">
      Demonstração de Resultado do Exercício (DRE)
    </h1>

    <p
      v-if="!journalEntryStore.journalEntries || journalEntryStore.journalEntries.length === 0"
      class="text-center p-4 bg-surface-100 border border-surface-200 rounded-lg text-surface-600 italic mt-4"
    >
      Nenhum lançamento contábil registrado. Por favor, adicione lançamentos na tela "Lançamentos
      Contábeis" para gerar a DRE.
    </p>

    <div v-else class="bg-surface-50 p-6 rounded-lg shadow-md">
      <div class="grid grid-cols-2 font-bold border-b-2 border-surface-500 pb-2 mb-4">
        <span class="text-surface-700">Descrição</span>
        <span class="text-right text-surface-700">Valor (R$)</span>
      </div>

      <div class="grid grid-cols-2 py-2 border-b border-surface-200">
        <span class="text-surface-800">Receita Bruta de Vendas</span>
        <span class="text-right font-medium text-surface-900">{{
          dreData.receitaBrutaVendas.toFixed(2)
        }}</span>
      </div>

      <div class="grid grid-cols-2 py-2 border-b border-surface-200">
        <span class="text-surface-800">(-) Deduções da Receita Bruta (ICMS sobre Vendas)</span>
        <span class="text-right font-medium text-red-600"
          >({{ dreData.deducoesReceitaBruta.toFixed(2) }})</span
        >
      </div>

      <div
        class="grid grid-cols-2 py-2 border-b border-surface-200 font-bold border-t border-surface-400 pt-4 mt-4"
      >
        <span class="text-surface-800">(=) Receita Líquida de Vendas</span>
        <span class="text-right text-surface-900">{{
          dreData.receitaLiquidaVendas.toFixed(2)
        }}</span>
      </div>

      <div class="grid grid-cols-2 py-2 border-b border-surface-200">
        <span class="text-surface-800">(-) Custo da Mercadoria Vendida (CMV)</span>
        <span class="text-right font-medium text-red-600">({{ dreData.cmv.toFixed(2) }})</span>
      </div>

      <div
        class="grid grid-cols-2 py-2 border-b border-surface-200 font-bold border-t border-surface-400 pt-4 mt-4"
      >
        <span class="text-surface-800">(=) Lucro Bruto</span>
        <span class="text-right text-surface-900">{{ dreData.lucroBruto.toFixed(2) }}</span>
      </div>

      <div class="grid grid-cols-2 py-2 font-bold border-t-2 border-emerald-500 pt-4 mt-4 text-lg">
        <span class="text-emerald-700">(=) Lucro Líquido do Exercício</span>
        <span class="text-right text-emerald-700">{{ dreData.lucroLiquido.toFixed(2) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useReportStore } from '@/stores/reportStore'

const props = defineProps<{
  startDate: string
  endDate: string
}>()

const reportStore = useReportStore()

async function fetchDFCData() {
  await reportStore.fetchReports(props.startDate, props.endDate)
}

watch(
  [() => props.startDate, () => props.endDate],
  () => {
    fetchDFCData()
  },
  { immediate: true },
)

const dfcData = computed(() => {
  const lle = reportStore.dreData.lucroLiquido
  const bsd = reportStore.balanceSheetData

  const varFornecedores = bsd.fornecedores
  const varImpostosAPagar = bsd.impostoAPagar
  const varClientes = bsd.clientes
  const varEstoque = bsd.estoqueDeMercadorias
  const varImobilizado = bsd.moveisEUtensilios
  const varCapitalSocial = bsd.capitalSocial

  let fluxoOperacional = lle
  fluxoOperacional += varFornecedores
  fluxoOperacional += varImpostosAPagar
  fluxoOperacional -= varClientes
  fluxoOperacional -= varEstoque

  let fluxoInvestimento = 0
  fluxoInvestimento -= varImobilizado
  fluxoInvestimento += varCapitalSocial

  const sldFinalCaixa = fluxoOperacional + fluxoInvestimento

  return {
    lucroLiquidoExercicio: lle,
    varFornecedores,
    varImpostosAPagar,
    varClientes,
    varEstoque,
    fluxoOperacional,
    varImobilizado,
    varCapitalSocial,
    fluxoInvestimento,
    sldFinalCaixa,
  }
})
</script>

<template>
  <div class="p-4 sm:p-6 max-w-7xl mx-auto bg-white rounded-lg shadow-md">
    <h1 class="text-2xl font-bold mb-4 text-center text-surface-800 border-b pb-2">
      Demonstração do Fluxo de Caixa
    </h1>

    <p
      v-if="!reportStore.reports || reportStore.reports.ledgerAccounts.length === 0"
      class="text-center p-4 bg-surface-100 border border-surface-200 rounded-lg text-surface-600 italic mt-4"
    >
      Nenhum lançamento contábil registrado. Por favor, adicione lançamentos na tela "Lançamentos
      Contábeis" para gerar a DFC.
    </p>

    <div v-else class="flex flex-col border border-surface-200 rounded-lg overflow-hidden">
      <div
        class="grid grid-cols-2 gap-4 bg-surface-100 font-bold p-3 border-b-2 border-surface-300 text-surface-700"
      >
        <span>Descrição</span>
        <span class="text-right">Valor</span>
      </div>

      <div class="grid grid-cols-2 gap-4 p-3 bg-surface-200 font-bold border-b border-surface-300">
        <span>(=) Lucro do Exercício</span>
        <span class="text-right">R$ {{ dfcData.lucroLiquidoExercicio.toFixed(2) }}</span>
      </div>

      <div class="grid grid-cols-2 gap-4 p-3 border-b border-surface-200">
        <span>(+) Var. Fornecedores</span>
        <span class="text-right">R$ {{ dfcData.varFornecedores.toFixed(2) }}</span>
      </div>
      <div class="grid grid-cols-2 gap-4 p-3 border-b border-surface-200">
        <span>(+) Var. Impostos</span>
        <span class="text-right">R$ {{ dfcData.varImpostosAPagar.toFixed(2) }}</span>
      </div>
      <div class="grid grid-cols-2 gap-4 p-3 border-b border-surface-200">
        <span>(-) Var. Clientes</span>
        <span class="text-right">-R$ {{ Math.abs(dfcData.varClientes).toFixed(2) }}</span>
      </div>
      <div class="grid grid-cols-2 gap-4 p-3 border-b border-surface-200">
        <span>(-) Var. Estoque</span>
        <span class="text-right">-R$ {{ Math.abs(dfcData.varEstoque).toFixed(2) }}</span>
      </div>

      <div class="grid grid-cols-2 gap-4 p-3 font-bold border-t border-surface-400 bg-surface-200">
        <span>(=) Atv. Operacional</span>
        <span class="text-right">R$ {{ dfcData.fluxoOperacional.toFixed(2) }}</span>
      </div>

      <div class="grid grid-cols-2 gap-4 p-3 border-b border-surface-200">
        <span>(-) Var. Imobilizado</span>
        <span class="text-right">-R$ {{ Math.abs(dfcData.varImobilizado).toFixed(2) }}</span>
      </div>
      <div class="grid grid-cols-2 gap-4 p-3 border-b border-surface-200">
        <span>(+) Var. Capital Social</span>
        <span class="text-right">R$ {{ dfcData.varCapitalSocial.toFixed(2) }}</span>
      </div>

      <div class="grid grid-cols-2 gap-4 p-3 font-bold border-t border-surface-400 bg-surface-200">
        <span>(=) Atv. Investimento</span>
        <span class="text-right">R$ {{ dfcData.fluxoInvestimento.toFixed(2) }}</span>
      </div>

      <div
        class="grid grid-cols-2 gap-4 p-3 font-bold border-t-2 border-surface-500 bg-emerald-100 text-emerald-800"
      >
        <span>(=) Sld Final de Caixa</span>
        <span class="text-right">R$ {{ dfcData.sldFinalCaixa.toFixed(2) }}</span>
      </div>
    </div>
  </div>
</template>

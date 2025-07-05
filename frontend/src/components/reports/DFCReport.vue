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
  <div class="dfc-container">
    <h1>Demonstração do Fluxo de Caixa</h1>

    <p
      v-if="!reportStore.reports || reportStore.reports.ledgerAccounts.length === 0"
      class="no-entries-message"
    >
      Nenhum lançamento contábil registrado. Por favor, adicione lançamentos na tela "Lançamentos
      Contábeis" para gerar a DFC.
    </p>

    <div v-else class="dfc-report">
      <div class="header-row">
        <span>Descrição</span>
        <span>Valor</span>
      </div>

      <div class="dfc-line subheader">
        <span>(=) Lucro do Exercício</span>
        <span>R$ {{ dfcData.lucroLiquidoExercicio.toFixed(2) }}</span>
      </div>

      <div class="dfc-line item">
        <span>(+) Var. Fornecedores</span>
        <span>R$ {{ dfcData.varFornecedores.toFixed(2) }}</span>
      </div>
      <div class="dfc-line item">
        <span>(+) Var. Impostos</span>
        <span>R$ {{ dfcData.varImpostosAPagar.toFixed(2) }}</span>
      </div>
      <div class="dfc-line item">
        <span>(-) Var. Clientes</span>
        <span>-R$ {{ Math.abs(dfcData.varClientes).toFixed(2) }}</span>
      </div>
      <div class="dfc-line item">
        <span>(-) Var. Estoque</span>
        <span>-R$ {{ Math.abs(dfcData.varEstoque).toFixed(2) }}</span>
      </div>

      <div class="dfc-total">
        <span>(=) Atv. Operacional</span>
        <span>R$ {{ dfcData.fluxoOperacional.toFixed(2) }}</span>
      </div>

      <div class="dfc-line item">
        <span>(-) Var. Imobilizado</span>
        <span>-R$ {{ Math.abs(dfcData.varImobilizado).toFixed(2) }}</span>
      </div>
      <div class="dfc-line item">
        <span>(+) Var. Capital Social</span>
        <span>R$ {{ dfcData.varCapitalSocial.toFixed(2) }}</span>
      </div>

      <div class="dfc-total">
        <span>(=) Atv. Investimento</span>
        <span>R$ {{ dfcData.fluxoInvestimento.toFixed(2) }}</span>
      </div>

      <div class="dfc-total final-total">
        <span>(=) Sld Final de Caixa</span>
        <span>R$ {{ dfcData.sldFinalCaixa.toFixed(2) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dfc-container {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
  font-family: Arial, sans-serif;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
}

.no-entries-message {
  text-align: center;
  color: #666;
  font-style: italic;
  margin-top: 50px;
}

.dfc-report {
  display: flex;
  flex-direction: column;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  overflow: hidden;
}

.header-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  background-color: #f0f0f0;
  font-weight: bold;
  padding: 10px 15px;
  border-bottom: 2px solid #ccc;
  color: #222;
}

.dfc-line {
  display: grid;
  grid-template-columns: 2fr 1fr;
  padding: 8px 15px;
  border-bottom: 1px dashed #eee;
  align-items: center;
  font-size: 0.95em;
  color: #333;
}

.dfc-line:last-of-type {
  border-bottom: none;
}

.dfc-line.subheader {
  font-weight: bold;
  background-color: #e9ecef;
}

.dfc-line.item {
}

.dfc-total {
  display: grid;
  grid-template-columns: 2fr 1fr;
  font-weight: bold;
  border-top: 1px solid #999;
  padding: 10px 15px;
  margin-top: 5px;
  background-color: #e9ecef;
  font-size: 1em;
}

.dfc-total span:last-child {
  text-align: right;
}

.dfc-total.final-total {
  border-top: 2px solid #333;
  background-color: #d4edda;
  font-size: 1.1em;
  color: #155724;
}

span:last-child {
  text-align: right;
  font-weight: normal;
}

.dfc-line.subheader span:last-child,
.dfc-total span:last-child {
  font-weight: bold;
}
</style>
<script setup lang="ts">
import { computed, watch } from 'vue'
import { useReportStore } from '@/stores/reportStore'
import { useJournalEntryStore } from '@/stores/journalEntryStore'

const props = defineProps<{
  startDate: string
  endDate: string
}>()

const reportStore = useReportStore()
const journalEntryStore = useJournalEntryStore()

async function fetchDREData() {
  await reportStore.fetchReports(props.startDate, props.endDate)
}

// Observa as mudanças nas props de data e busca os dados
watch(
  [() => props.startDate, () => props.endDate],
  () => {
    fetchDREData()
  },
  { immediate: true },
) // Executa imediatamente na montagem

const dreData = computed(() => reportStore.dreData)
</script>

<template>
  <div class="dre-container">
    <h1>Demonstração de Resultado do Exercício (DRE)</h1>

    <p
      v-if="!journalEntryStore.journalEntries || journalEntryStore.journalEntries.length === 0"
      class="no-entries-message"
    >
      Nenhum lançamento contábil registrado. Por favor, adicione lançamentos na tela "Lançamentos
      Contábeis" para gerar a DRE.
    </p>

    <div v-else class="dre-report">
      <div class="dre-section header">
        <span>Descrição</span>
        <span>Valor (R$)</span>
      </div>

      <div class="dre-line">
        <span class="description">Receita Bruta de Vendas</span>
        <span class="value">{{ dreData.receitaBrutaVendas.toFixed(2) }}</span>
      </div>

      <div class="dre-line deduction">
        <span class="description">(-) Deduções da Receita Bruta (ICMS sobre Vendas)</span>
        <span class="value">({{ dreData.deducoesReceitaBruta.toFixed(2) }})</span>
      </div>

      <div class="dre-line subtotal">
        <span class="description">(=) Receita Líquida de Vendas</span>
        <span class="value">{{ dreData.receitaLiquidaVendas.toFixed(2) }}</span>
      </div>

      <div class="dre-line cost">
        <span class="description">(-) Custo da Mercadoria Vendida (CMV)</span>
        <span class="value">({{ dreData.cmv.toFixed(2) }})</span>
      </div>

      <div class="dre-line total">
        <span class="description">(=) Lucro Bruto</span>
        <span class="value">{{ dreData.lucroBruto.toFixed(2) }}</span>
      </div>

      <div class="dre-line final-result">
        <span class="description">(=) Lucro Líquido do Exercício</span>
        <span class="value">{{ dreData.lucroLiquido.toFixed(2) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dre-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  font-family: Arial, sans-serif;
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

.dre-report {
  background-color: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  padding: 20px;
  margin-bottom: 30px; /* Adicionado para espaçamento */
}

.dre-section.header {
  display: grid;
  grid-template-columns: 3fr 1fr;
  font-weight: bold;
  border-bottom: 2px solid #333;
  padding-bottom: 10px;
  margin-bottom: 10px;
}

.dre-line {
  display: grid;
  grid-template-columns: 3fr 1fr;
  padding: 8px 0;
  border-bottom: 1px dashed #eee;
  align-items: center;
}

.dre-line:last-of-type {
  border-bottom: none;
}

.description {
  padding-left: 10px;
}

.value {
  text-align: right;
  padding-right: 10px;
  font-weight: 500;
}

.deduction .value,
.cost .value {
  color: #dc3545;
}

.subtotal,
.total,
.final-result {
  font-weight: bold;
  border-top: 1px solid #ccc;
  margin-top: 10px;
  padding-top: 10px;
}

.final-result {
  border-top: 2px solid #333;
  margin-top: 15px;
  padding-top: 15px;
  font-size: 1.2rem;
  color: #28a745;
}
</style>

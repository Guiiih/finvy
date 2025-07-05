<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useReportStore } from '@/stores/reportStore'
import { useJournalEntryStore } from '@/stores/journalEntryStore'

const reportStore = useReportStore()
const journalEntryStore = useJournalEntryStore()

const startDate = ref('')
const endDate = ref('')

async function fetchVariationData() {
  await reportStore.fetchReports(startDate.value, endDate.value)
}

onMounted(async () => {
  const today = new Date()
  endDate.value = today.toISOString().split('T')[0]
  startDate.value = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0]
  await fetchVariationData()
})

const variationData = computed(() => reportStore.variationData)
</script>

<template>
  <div class="variation-container">
    <h1>Demonstrativo de Variações</h1>

    <div class="date-filter-section">
      <label for="startDate">Data Inicial:</label>
      <input type="date" id="startDate" v-model="startDate" @change="fetchVariationData" />
      <label for="endDate">Data Final:</label>
      <input type="date" id="endDate" v-model="endDate" @change="fetchVariationData" />
    </div>

    <p
      v-if="!journalEntryStore.journalEntries || journalEntryStore.journalEntries.length === 0"
      class="no-entries-message"
    >
      Nenhum lançamento contábil registrado. Por favor, adicione lançamentos na tela "Lançamentos
      Contábeis" para gerar a DFC.
    </p>

    <div v-else class="variation-table">
      <div class="header-row">
        <span>Descrição</span>
        <span>Valor</span>
        <span>Tipo</span>
        <span>Variação</span>
        <span>Atividade</span>
      </div>

      <template v-for="(entry, index) in variationData" :key="index">
        <div
          v-if="
            entry.value !== 0 ||
            entry.isMainCategory ||
            entry.isSubtotal ||
            entry.description === 'Passivo Não Circulante' ||
            entry.description === 'Lucro Líquido do Exercício'
          "
          :class="{
            'variation-row': true,
            'main-category': entry.isMainCategory,
            'sub-total': entry.isSubtotal,
            'positive-var': entry.signedVariationValue >= 0,
            'negative-var': entry.signedVariationValue < 0,
            'no-border-bottom': entry.isMainCategory,
            indented:
              !entry.isMainCategory &&
              !entry.isSubtotal &&
              (entry.description === 'Disponibilidades' ||
                entry.description === 'Clientes' ||
                entry.description === 'Estoque de Mercadorias' ||
                entry.description === 'Imobilizado' ||
                entry.description === 'Fornecedores' ||
                entry.description === 'Despesas com Pessoal' ||
                entry.description === 'Imposto a Pagar' ||
                entry.description === 'Capital Social' ||
                entry.description === 'Reservas' ||
                entry.description === 'Passivo Não Circulante' ||
                entry.description === 'Lucro Líquido do Exercício' ||
                entry.description === 'BCM - CEF' ||
                entry.description === 'BCM - Itau' ||
                entry.description === 'BCM - Bradesco' ||
                entry.description === 'Caixa' ||
                entry.description === 'Imobilizado'),
            'double-indented': [
              'Caixa',
              'BCM - CEF',
              'BCM - Itau',
              'BCM - Bradesco',
              'Estoque Final',
              'Moveis e utensílios',
              'Salários a Pagar',
              'ICMS a Recolher',
              'Capital Social Subscrito',
              '(-) Capital Social a Integralizar',
              'Reserva de Lucro',
            ].includes(entry.description),
          }"
        >
          <span>{{ entry.description }}</span>
          <span>R$ {{ entry.value.toFixed(2) }}</span>
          <span>{{ entry.type }}</span>
          <span
            >{{ entry.signedVariationValue >= 0 ? 'R$' : '-R$' }}
            {{ Math.abs(entry.signedVariationValue).toFixed(2) }}</span
          >
          <span>{{ entry.activity }}</span>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.variation-container {
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;
  font-family: Arial, sans-serif;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
}

.variation-table {
  display: flex;
  flex-direction: column;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  overflow: hidden;
}

.header-row,
.variation-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1.2fr 1.5fr;
  padding: 10px 15px;
  border-bottom: 1px solid #eee;
  align-items: center;
}

.header-row {
  background-color: #f0f0f0;
  font-weight: bold;
  color: #222;
  border-bottom: 2px solid #ccc;
}

.variation-row {
  background-color: #fff;
  color: #333;
}

.variation-row:nth-child(even) {
  background-color: #f8f8f8;
}

.main-category {
  font-weight: bold;
  background-color: #e9ecef;
  border-top: 1px solid #ccc;
  border-bottom: 1px solid #ccc;
  font-size: 1.1em;
}

.sub-total {
  font-weight: bold;
  background-color: #f3f3f3;
  border-top: 1px dashed #ddd;
}

.indented {
  padding-left: 20px;
}

.double-indented {
  padding-left: 40px;
}

.positive-var {
  color: #28a745;
}

.negative-var {
  color: #dc3545;
}
</style>
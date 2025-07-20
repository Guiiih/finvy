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
  <div class="p-4 sm:p-6 max-w-7xl mx-auto">
    <h1 class="text-2xl font-bold mb-4 text-center text-surface-800">Demonstrativo de Variações</h1>

    

    <p
      v-if="!journalEntryStore.journalEntries || journalEntryStore.journalEntries.length === 0"
      class="text-center p-4 bg-surface-100 border border-surface-200 rounded-lg text-surface-600 italic mt-4"
    >
      Nenhum lançamento contábil registrado. Por favor, adicione lançamentos na tela "Lançamentos
      Contábeis" para gerar a DFC.
    </p>

    <div v-else class="overflow-x-auto bg-white rounded-lg shadow-md">
      <div
        class="grid grid-cols-5 gap-4 p-3 font-bold text-surface-500 uppercase text-sm border-b border-surface-200 bg-surface-100"
      >
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
            'grid grid-cols-5 gap-4 p-3 items-center border-b border-surface-200': true,
            'font-bold bg-surface-200': entry.isMainCategory,
            'font-semibold bg-surface-100': entry.isSubtotal,
            'text-emerald-600': entry.signedVariationValue >= 0,
            'text-red-600': entry.signedVariationValue < 0,
            'pl-8':
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
            'pl-16': [
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
            >{{ entry.signedVariationValue >= 0 ? 'R$ ' : '-R$ ' }}
            {{ Math.abs(entry.signedVariationValue).toFixed(2) }}</span
          >
          <span>{{ entry.activity }}</span>
        </div>
      </template>
    </div>
  </div>
</template>

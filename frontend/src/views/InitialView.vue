<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import InfoCard from '@/components/InfoCard.vue'
import { useReportStore } from '@/stores/reportStore'

const reportStore = useReportStore()

const startDate = ref('')
const endDate = ref('')

const totalAtivo = computed(() => reportStore.balanceSheetData.totalDoAtivo)
const lucroLiquido = computed(() => reportStore.dreData.lucroLiquido)
const totalPassivo = computed(() => reportStore.balanceSheetData.totalDoPassivo)

onMounted(async () => {
  const today = new Date()
  endDate.value = today.toISOString().split('T')[0]
  startDate.value = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0]
  await reportStore.fetchReports(startDate.value, endDate.value)
})
</script>

<template>
  <div class="p-4 sm:p-6 max-w-7xl mx-auto">
    <h1 class="text-2xl font-bold mb-4 text-center text-surface-800">Visão Geral do Finvy</h1>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <InfoCard title="Total do Ativo" :value="totalAtivo" currency="R$" :is-positive="true" />
      <InfoCard
        title="Lucro Líquido"
        :value="lucroLiquido"
        currency="R$"
        :is-positive="lucroLiquido >= 0"
      />
      <InfoCard title="Total do Passivo" :value="totalPassivo" currency="R$" :is-positive="null" />
    </div>
  </div>
</template>


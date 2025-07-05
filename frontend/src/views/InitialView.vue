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
  <div class="dashboard-container">
    <h1>Visão Geral do Finvy</h1>

    <div class="info-cards-grid">
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

<style scoped>
.dashboard-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  font-family: Arial, sans-serif;
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
}

.info-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 25px;
  margin-bottom: 40px;
}
</style>
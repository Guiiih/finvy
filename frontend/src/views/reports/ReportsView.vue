<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useReportStore } from '@/stores/reportStore'
import { RouterView, useRouter } from 'vue-router'
import { api } from '@/services/api'

const reportStore = useReportStore()
const router = useRouter()

const startDate = ref('')
const endDate = ref('')
const selectedFormat = ref('csv')
const selectedReportType = ref('')

onMounted(() => {
  const today = new Date()
  endDate.value = today.toISOString().split('T')[0]
  startDate.value = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0]
})

watch([startDate, endDate, selectedReportType], ([newStartDate, newEndDate, newReportType]) => {
  router.replace({
    query: {
      startDate: newStartDate,
      endDate: newEndDate,
      reportType: newReportType,
    },
  })
})

const exportSelectedReport = async () => {
  if (!selectedReportType.value) {
    reportStore.error = 'Por favor, selecione um tipo de relatório para exportar.'
    return
  }

  try {
    reportStore.loading = true
    reportStore.error = null

    const response = await api.post(
      '/reports/export',
      {
        reportType: selectedReportType.value,
        startDate: startDate.value,
        endDate: endDate.value,
        format: selectedFormat.value,
      },
      {
        responseType: 'blob',
      },
    )

    const url = window.URL.createObjectURL(new Blob([response as Blob]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${selectedReportType.value}_report.${selectedFormat.value}`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  } catch (error: unknown) {
    console.error('Erro ao exportar relatório:', error)
    reportStore.error = error instanceof Error ? error.message : 'Erro ao exportar relatório.'
  } finally {
    reportStore.loading = false
  }
}
</script>

<template>
  <div class="p-4 sm:p-6 max-w-7xl mx-auto">
    <h1 class="text-2xl font-bold mb-4 text-center text-surface-800">Relatórios Financeiros</h1>

    <div
      class="flex flex-wrap items-center justify-center gap-4 mb-6 p-4 bg-surface-50 rounded-lg shadow-md"
    >
      <div class="flex flex-col sm:flex-row items-center gap-2">
        <label for="startDate" class="font-medium text-surface-700">Data Inicial:</label>
        <input
          type="date"
          id="startDate"
          v-model="startDate"
          class="p-2 border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
      </div>
      <div class="flex flex-col sm:flex-row items-center gap-2">
        <label for="endDate" class="font-medium text-surface-700">Data Final:</label>
        <input
          type="date"
          id="endDate"
          v-model="endDate"
          class="p-2 border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
      </div>

      <div class="flex flex-col sm:flex-row items-center gap-2">
        <label for="reportType" class="font-medium text-surface-700">Tipo de Relatório:</label>
        <select
          id="reportType"
          v-model="selectedReportType"
          class="p-2 border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
        >
          <option value="">Selecione um relatório</option>
          <option value="dre">DRE</option>
          <option value="balance-sheet">Balanço Patrimonial</option>
          <option value="dfc">DFC</option>
          <option value="variations">Variações</option>
          <option value="trial-balance">Balancete</option>
          <option value="ledgerDetails">Razão Detalhado</option>
        </select>
      </div>

      <template v-if="selectedReportType">
        <div class="flex flex-col sm:flex-row items-center gap-2">
          <label for="exportFormat" class="font-medium text-surface-700">Formato:</label>
          <select
            id="exportFormat"
            v-model="selectedFormat"
            class="p-2 border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            <option value="csv">CSV</option>
            <option value="xlsx">XLSX</option>
            <option value="pdf">PDF</option>
          </select>
        </div>
        <button
          @click="exportSelectedReport"
          class="px-4 py-2 bg-emerald-400 text-white rounded-md hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-50"
        >
          Exportar
        </button>
      </template>
    </div>

    <p
      v-if="reportStore.loading"
      class="text-center p-4 bg-surface-100 border border-surface-200 rounded-lg text-surface-600 italic mt-4"
    >
      Gerando relatórios...
    </p>
    <p
      v-else-if="reportStore.error"
      class="text-center p-4 bg-red-100 border border-red-200 rounded-lg text-red-700 mt-4"
    >
      Erro ao gerar relatórios: {{ reportStore.error }}
    </p>
    <p
      v-else
      class="text-center p-4 bg-surface-100 border border-surface-200 rounded-lg text-surface-600 italic mt-4"
    >
      Selecione um período e o tipo de relatório para visualizar os dados.
    </p>

    <RouterView v-if="selectedReportType" :startDate="startDate" :endDate="endDate" :reportType="selectedReportType" />
  </div>
</template>

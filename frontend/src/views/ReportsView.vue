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

onMounted(() => {
  const today = new Date()
  endDate.value = today.toISOString().split('T')[0]
  startDate.value = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0]
})

watch([startDate, endDate], ([newStartDate, newEndDate]) => {
  router.replace({
    query: {
      startDate: newStartDate,
      endDate: newEndDate,
    },
  })
})

const navigateToReport = (reportName: string) => {
  router.push({
    path: `/reports/${reportName}`,
    query: {
      startDate: startDate.value,
      endDate: endDate.value,
    },
  })
}

const exportReport = async (reportType: string) => {
  try {
    reportStore.loading = true;
    reportStore.error = null;

    const response = await api.post(
      '/reports/export',
      {
        reportType,
        startDate: startDate.value,
        endDate: endDate.value,
        format: selectedFormat.value,
      },
      {
        responseType: 'blob',
      }
    );

    const url = window.URL.createObjectURL(new Blob([response as Blob]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${reportType}_report.${selectedFormat.value}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

  } catch (error: unknown) {
    console.error('Erro ao exportar relatório:', error);
    reportStore.error = error instanceof Error ? error.message : 'Erro ao exportar relatório.';
  } finally {
    reportStore.loading = false;
  }
};
</script>

<template>
  <div class="reports-container">
    <h1>Relatórios Financeiros</h1>

    <div class="date-filter-section">
      <label for="startDate">Data Inicial:</label>
      <input type="date" id="startDate" v-model="startDate" />
      <label for="endDate">Data Final:</label>
      <input type="date" id="endDate" v-model="endDate" />
      <button @click="navigateToReport('dre')" class="px-4 py-2 bg-emerald-400 text-white rounded-md hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-50">Ver DRE</button>
      <button @click="navigateToReport('balance-sheet')" class="px-4 py-2 bg-emerald-400 text-white rounded-md hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-50">Ver Balanço</button>
      <button @click="navigateToReport('dfc')" class="px-4 py-2 bg-emerald-400 text-white rounded-md hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-50">Ver DFC</button>
      <label for="exportFormat">Formato:</label>
      <select id="exportFormat" v-model="selectedFormat">
        <option value="csv">CSV</option>
        <option value="xlsx">XLSX</option>
        <option value="pdf">PDF</option>
      </select>
      <button @click="exportReport('trialBalance')" class="px-4 py-2 bg-emerald-400 text-white rounded-md hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-50">Exportar Balancete</button>
      <button @click="exportReport('dre')" class="px-4 py-2 bg-emerald-400 text-white rounded-md hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-50">Exportar DRE</button>
      <button @click="exportReport('balanceSheet')" class="px-4 py-2 bg-emerald-400 text-white rounded-md hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-50">Exportar Balanço</button>
      <button @click="exportReport('ledgerDetails')" class="px-4 py-2 bg-emerald-400 text-white rounded-md hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-50">Exportar Razão Detalhado</button>
    </div>

    <p v-if="reportStore.loading" class="loading-message">Gerando relatórios...</p>
    <p v-else-if="reportStore.error" class="error-message">
      Erro ao gerar relatórios: {{ reportStore.error }}
    </p>
    <p v-else class="info-message">
      Selecione um período e o tipo de relatório para visualizar os dados.
    </p>

    <RouterView :startDate="startDate" :endDate="endDate" />
  </div>
</template>

<style scoped>
.reports-container {
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;
  font-family: Arial, sans-serif;
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
}

.date-filter-section {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 20px;
  background-color: #f9f9f9;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.date-filter-section label {
  font-weight: bold;
  color: #555;
}

.date-filter-section input[type='date'] {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1em;
}

.loading-message,
.error-message,
.info-message {
  text-align: center;
  padding: 20px;
  background-color: #f9f9f9;
  border: 1px dashed #ddd;
  border-radius: 8px;
  color: #666;
  font-style: italic;
  margin-top: 20px;
}

.error-message {
  background-color: #f8d7da;
  color: #721c24;
  border-color: #f5c6cb;
}

.reports-generated-section {
  margin-top: 30px;
}

.reports-generated-section h2 {
  color: #333;
  margin-bottom: 15px;
}

.reports-generated-section ul {
  list-style: none;
  padding: 0;
}

.reports-generated-section li {
  margin-bottom: 10px;
}

.reports-generated-section a {
  display: block;
  padding: 10px 15px;
  background-color: #e9ecef;
  border-radius: 5px;
  text-decoration: none;
  color: #007bff;
  font-weight: bold;
  transition: background-color 0.2s;
}

.reports-generated-section a:hover {
  background-color: #dee2e6;
}
</style>
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useReportStore } from '@/stores/reportStore';

const reportStore = useReportStore();

const startDate = ref('');
const endDate = ref('');

async function generateReports() {
  await reportStore.fetchReports(startDate.value, endDate.value);
}

onMounted(() => {
  const today = new Date();
  endDate.value = today.toISOString().split('T')[0];
  startDate.value = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
});
</script>

<template>
  <div class="reports-container">
    <h1>Relatórios Financeiros</h1>

    <div class="date-filter-section">
      <label for="startDate">Data Inicial:</label>
      <input type="date" id="startDate" v-model="startDate" />
      <label for="endDate">Data Final:</label>
      <input type="date" id="endDate" v-model="endDate" />
      <button @click="generateReports">Gerar Relatórios</button>
    </div>

    <p v-if="reportStore.loading" class="loading-message">Gerando relatórios...</p>
    <p v-else-if="reportStore.error" class="error-message">Erro ao gerar relatórios: {{ reportStore.error }}</p>
    <p v-else class="info-message">Selecione um período e clique em "Gerar Relatórios" para visualizar os dados.</p>

    <!-- Aqui você pode adicionar links ou componentes para exibir os relatórios gerados -->
    <div v-if="reportStore.reports">
      <h2>Relatórios Gerados:</h2>
      <ul>
        <li><router-link to="/ledger">Razão</router-link></li>
        <li><router-link to="/trial-balance">Balancete de Verificação</router-link></li>
        <li><router-link to="/dre">Demonstração de Resultado do Exercício (DRE)</router-link></li>
        <li><router-link to="/balance-sheet">Balanço Patrimonial</router-link></li>
        <li><router-link to="/dfc">Demonstração do Fluxo de Caixa (DFC)</router-link></li>
      </ul>
    </div>
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

.date-filter-section input[type="date"] {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1em;
}

.date-filter-section button {
  padding: 8px 15px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1em;
  transition: background-color 0.2s;
}

.date-filter-section button:hover {
  background-color: #0056b3;
}

.loading-message, .error-message, .info-message {
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
<template>
  <div class="trial-balance-container">
    <h1>Balancete de Verificação</h1>

    <p v-if="reportStore.loading" class="loading-message">Carregando balancete...</p>
    <p v-else-if="reportStore.error" class="error-message">
      Erro ao carregar balancete: {{ reportStore.error }}
    </p>
    <p v-else-if="reportStore.trialBalanceData.length === 0" class="no-data-message">
      Nenhum dado de balancete para exibir. Adicione lançamentos contábeis.
    </p>
    <div v-else class="trial-balance-table">
      <table>
        <thead>
          <tr>
            <th>Conta</th>
            <th>Tipo</th>
            <th>Débito</th>
            <th>Crédito</th>
            <th>Saldo Final</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="account in reportStore.trialBalanceData" :key="account.account_id">
            <td>{{ account.accountName }}</td>
            <td>{{ account.type }}</td>
            <td>R$ {{ account.totalDebits.toFixed(2) }}</td>
            <td>R$ {{ account.totalCredits.toFixed(2) }}</td>
            <td :class="{ 'positive': account.finalBalance >= 0, 'negative': account.finalBalance < 0 }">
              R$ {{ account.finalBalance.toFixed(2) }}
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2">Totais</td>
            <td>R$ {{ totalDebitsBalance.toFixed(2) }}</td>
            <td>R$ {{ totalCreditsBalance.toFixed(2) }}</td>
            <td>R$ {{ (totalDebitsBalance - totalCreditsBalance).toFixed(2) }}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useReportStore } from '@/stores/reportStore';

const reportStore = useReportStore();

const startDate = ref('');
const endDate = ref('');

async function fetchTrialBalanceData() {
  await reportStore.fetchTrialBalance(startDate.value, endDate.value);
}

onMounted(async () => {
  const today = new Date();
  endDate.value = today.toISOString().split('T')[0];
  startDate.value = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
  await fetchTrialBalanceData();
});

const totalDebitsBalance = computed(() => {
  return reportStore.trialBalanceData.reduce((sum, account) => sum + account.totalDebits, 0);
});

const totalCreditsBalance = computed(() => {
  return reportStore.trialBalanceData.reduce((sum, account) => sum + account.totalCredits, 0);
});
</script>

<style scoped>
.trial-balance-container {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
  font-family: Arial, sans-serif;
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
}

.loading-message, .error-message, .no-data-message {
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

.trial-balance-table table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.trial-balance-table th,
.trial-balance-table td {
  border: 1px solid #ddd;
  padding: 12px;
  text-align: left;
}

.trial-balance-table th {
  background-color: #f2f2f2;
  font-weight: bold;
  color: #333;
}

.trial-balance-table tfoot td {
  font-weight: bold;
  background-color: #e9ecef;
}

.trial-balance-table .positive {
  color: #28a745;
}

.trial-balance-table .negative {
  color: #dc3545;
}
</style>
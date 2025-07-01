<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useStockControlStore } from '@/stores/stockControlStore';
import { useProductStore } from '@/stores/productStore';
import { useReportStore } from '@/stores/reportStore';

const stockControlStore = useStockControlStore();
const productStore = useProductStore();
const reportStore = useReportStore();

const startDate = ref('');
const endDate = ref('');

async function fetchStockData() {
  await reportStore.fetchReports(startDate.value, endDate.value);
}

onMounted(async () => {
  const today = new Date();
  endDate.value = today.toISOString().split('T')[0];
  startDate.value = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
  await fetchStockData();
});
</script>

<template>
  <div class="stock-control-container">
    <h1>Controle de Estoque</h1>

    <div class="date-filter-section">
      <label for="startDate">Data Inicial:</label>
      <input type="date" id="startDate" v-model="startDate" @change="fetchStockData" />
      <label for="endDate">Data Final:</label>
      <input type="date" id="endDate" v-model="endDate" @change="fetchStockData" />
    </div>

    <p v-if="reportStore.loading" class="loading-message">Carregando dados de estoque...</p>
    <p v-else-if="reportStore.error" class="error-message">
      Erro ao carregar dados: {{ reportStore.error }}
    </p>
    <p v-else-if="stockControlStore.balances.length === 0" class="no-stock-message">
      Nenhum balanço de estoque para exibir. Adicione produtos e lançamentos contábeis.
    </p>
    <div v-else class="stock-list">
      <div v-for="balance in stockControlStore.balances" :key="balance.product_id" class="stock-item">
        <h3>{{ productStore.getProductById(balance.product_id)?.name || 'Produto Desconhecido' }}</h3>
        <p>Quantidade: {{ balance.quantity }}</p>
        <p>Custo Unitário Médio: R$ {{ balance.unit_cost.toFixed(2) }}</p>
        <p>Valor Total: R$ {{ balance.totalValue.toFixed(2) }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stock-control-container {
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

.stock-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.stock-item {
  background-color: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  padding: 20px;
  text-align: center;
}

.stock-item h3 {
  color: #007bff;
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 1.3em;
}

.stock-item p {
  margin: 5px 0;
  color: #555;
  font-size: 1em;
}

.stock-item p:last-child {
  font-weight: bold;
  color: #333;
  font-size: 1.1em;
}

.no-stock-message, .error-message {
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
</style>
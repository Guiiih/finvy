<template>
  <div class="stock-control-view">
    <h1>Controle de Estoque</h1>

    <div class="product-selector">
      <label for="product-select">Selecione o Produto:</label>
      <select id="product-select" v-model="selectedProductId">
        <option v-for="product in productStore.products" :key="product.id" :value="product.id">
          {{ product.name }}
        </option>
      </select>
    </div>

    <div v-if="selectedProductBalance" class="summary-card">
      <h2>Resumo Final do Estoque para {{ selectedProductName }}</h2>
      <p>Quantidade Atual: <strong>{{ selectedProductBalance.quantity }} unds</strong></p>
      <p>Custo Médio Unitário: <strong>R$ {{ selectedProductBalance.unitCost.toFixed(2) }}</strong></p>
      <p>Valor Total em Estoque: <strong>R$ {{ selectedProductBalance.totalValue.toFixed(2) }}</strong></p>
    </div>
    <div v-else class="summary-card">
      <p>Selecione um produto para ver o resumo do estoque.</p>
    </div>

    <div class="summary-card mt-4">
      <h2>Apuração de Resultados do Estoque (Global)</h2>
      <p>Custo das Mercadorias Vendidas (CMV) Total: <strong>R$ {{ stockControlStore.totalCostOfGoodsSold.toFixed(2) }}</strong></p>
      <p>Estoque Final (Produto X): <strong>R$ {{ stockControlStore.finalInventoryValue(productStore.getProductByName('Produto X')?.id || '').toFixed(2) }}</strong></p>
      </div>

    <div class="movements-table">
      <h2>Movimentos de Estoque para {{ selectedProductName }}</h2>
      <table>
        <thead>
          <tr>
            <th rowspan="2">DESC</th>
            <th colspan="3">Entrada</th>
            <th colspan="3">Saída</th>
            <th colspan="3">Saldo</th>
          </tr>
          <tr>
            <th>QTD</th>
            <th>Custo Unit.</th>
            <th>Total</th>
            <th>QTD</th>
            <th>Custo Unit.</th>
            <th>Total</th>
            <th>QTD</th>
            <th>Custo Unit.</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="movement in filteredMovements" :key="movement.id">
            <td>{{ movement.journalEntryId ? getJournalEntryDescription(movement.journalEntryId) : 'Movimento Interno' }}</td>
            <template v-if="movement.type === 'in'">
              <td>{{ movement.quantity }}</td>
              <td>R$ {{ movement.unitPrice.toFixed(2) }}</td>
              <td>R$ {{ movement.totalValue.toFixed(2) }}</td>
              <td>-</td>
              <td>-</td>
              <td>-</td>
            </template>
            <template v-else>
              <td>-</td>
              <td>-</td>
              <td>-</td>
              <td>{{ movement.quantity }}</td>
              <td>R$ {{ movement.unitPrice.toFixed(2) }}</td>
              <td>R$ {{ movement.totalValue.toFixed(2) }}</td>
            </template>
            <td v-if="movement.id.includes('mov-compra') || movement.id.includes('mov-venda')">
              {{ getBalanceAfterMovement(movement.id)?.quantity || '-' }}
            </td>
            <td v-if="movement.id.includes('mov-compra') || movement.id.includes('mov-venda')">
              R$ {{ (getBalanceAfterMovement(movement.id)?.unitCost || 0).toFixed(2) }}
            </td>
            <td v-if="movement.id.includes('mov-compra') || movement.id.includes('mov-venda')">
              R$ {{ (getBalanceAfterMovement(movement.id)?.totalValue || 0).toFixed(2) }}
            </td>
          </tr>
          <tr v-if="filteredMovements.length === 0">
            <td colspan="10">Nenhum movimento registrado para este produto ainda.</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td>Total</td>
            <td>-</td>
            <td>-</td>
            <td>R$ {{ totalEntranceValue.toFixed(2) }}</td>
            <td>-</td>
            <td>-</td>
            <td>R$ {{ totalExitValue.toFixed(2) }}</td>
            <td>-</td>
            <td>-</td>
            <td>R$ {{ selectedProductBalance ? selectedProductBalance.totalValue.toFixed(2) : (0).toFixed(2) }}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useStockControlStore } from '../stores/stockControlStore';
import { useProductStore } from '../stores/productStore';
import { useJournalEntryStore } from '../stores/journalEntryStore';
import type { ProductBalance, StockMovement } from '../types';

const stockControlStore = useStockControlStore();
const productStore = useProductStore();
const journalEntryStore = useJournalEntryStore();

const selectedProductId = ref<string | null>(null);

// Set initial product if available
onMounted(() => {
  if (productStore.products.length > 0) {
    selectedProductId.value = productStore.products[0].id;
  }
});

const selectedProductName = computed(() => {
  return productStore.getProductById(selectedProductId.value || '')?.name || 'Produto X';
});

const selectedProductBalance = computed(() => {
  if (!selectedProductId.value) return null;
  return stockControlStore.getBalanceByProductId(selectedProductId.value);
});

const filteredMovements = computed(() => {
  if (!selectedProductId.value) return [];
  return stockControlStore.getAllMovements.filter(m => m.productId === selectedProductId.value);
});

// Função para obter a descrição do lançamento contábil
function getJournalEntryDescription(journalEntryId: string): string {
  const entry = journalEntryStore.getJournalEntryById(journalEntryId.replace('-mov-compra', '').replace('-mov-venda', ''));
  return entry ? entry.description : 'Lançamento Desconhecido';
}

// Calcular o saldo após cada movimento (para a tabela)
// Isso é um pouco mais complexo e exigiria uma lógica de re-cálculo para cada linha
// Para simplicidade, vamos calcular o saldo cumulativo
const balanceHistory = computed(() => {
    const history: { [movementId: string]: ProductBalance } = {};
    let currentQuantity = 0;
    let currentTotalValue = 0;
    let currentUnitCost = 0;

    // Ordenar os movimentos por data e depois por ID (para consistência)
    const sortedMovements = [...filteredMovements.value].sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (dateA !== dateB) return dateA - dateB;
        return a.id.localeCompare(b.id);
    });

    sortedMovements.forEach(movement => {
        if (movement.type === 'in') {
            currentQuantity += movement.quantity;
            currentTotalValue += movement.totalValue;
            currentUnitCost = currentTotalValue / currentQuantity;
        } else if (movement.type === 'out') {
            const costOfSale = movement.quantity * currentUnitCost; // Custo médio da saída
            currentQuantity -= movement.quantity;
            currentTotalValue -= costOfSale;
            currentUnitCost = currentQuantity > 0 ? currentTotalValue / currentQuantity : 0;
        }
        history[movement.id] = {
            productId: movement.productId,
            quantity: currentQuantity,
            unitCost: currentUnitCost,
            totalValue: currentTotalValue
        };
    });
    return history;
});

function getBalanceAfterMovement(movementId: string): ProductBalance | undefined {
  return balanceHistory.value[movementId];
}

const totalEntranceValue = computed(() => {
  return filteredMovements.value
    .filter(m => m.type === 'in')
    .reduce((sum, m) => sum + m.totalValue, 0);
});

const totalExitValue = computed(() => {
  return filteredMovements.value
    .filter(m => m.type === 'out')
    .reduce((sum, m) => sum + m.totalValue, 0); // Este já é o CMV por movimento
});

// Você já tem `stockControlStore.totalCostOfGoodsSold` e `stockControlStore.finalInventoryValue`
// para os totais globais no store.
</script>

<style scoped>
.stock-control-view {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  font-family: Arial, sans-serif;
}

h1, h2 {
  color: #333;
  margin-bottom: 20px;
}

.product-selector {
  margin-bottom: 20px;
}

.product-selector label {
  font-weight: bold;
  margin-right: 10px;
}

.product-selector select {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.summary-card {
  background-color: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.summary-card p {
  margin: 5px 0;
  font-size: 1.1em;
}

.movements-table table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.movements-table th,
.movements-table td {
  border: 1px solid #ddd;
  padding: 10px;
  text-align: left;
}

.movements-table th {
  background-color: #f2f2f2;
  font-weight: bold;
  color: #333;
}

.movements-table tfoot td {
  font-weight: bold;
  background-color: #e9ecef;
}

.mt-4 {
  margin-top: 1.5rem;
}
</style>
<script setup lang="ts">
import { ref, computed } from 'vue';
import { useStockControlStore } from '../stores/stockControlStore';
import { useProductStore } from '../stores/productStore';
import { useJournalEntryStore } from '../stores/journalEntryStore';
import type { StockMovement, StockBalance } from '../types/index';

const stockControlStore = useStockControlStore();
const productStore = useProductStore();
const journalEntryStore = useJournalEntryStore();

const selectedProductId = ref('');

const products = computed(() => productStore.getAllProducts);

const movementsForSelectedProduct = computed(() => {
  if (!selectedProductId.value) return [];
  return stockControlStore.getMovementsByProductId(selectedProductId.value);
});

const currentBalanceForSelectedProduct = computed(() => {
  if (!selectedProductId.value) return null;
  return stockControlStore.getBalanceByProductId(selectedProductId.value);
});

// Ficha de Estoque com Saldo Acumulado
const stockLedgerTable = computed(() => {
  const movements = movementsForSelectedProduct.value;
  if (movements.length === 0) return [];

  let currentQuantity = 0;
  let currentTotalValue = 0;
  let currentUnitCost = 0;

  const tableData: any[] = [];

  // Variáveis para somar os totais da tabela
  let totalEntradaValor = 0;
  let totalSaidaValor = 0;

  movements.forEach(movement => {
    if (movement.type === 'in') {
      currentQuantity += movement.quantity;
      currentTotalValue += (movement.quantity * movement.unitPrice);
      totalEntradaValor += movement.totalValue; // Adiciona ao total de entrada
    } else { // type === 'out'
      currentQuantity -= movement.quantity;
      currentTotalValue -= (movement.quantity * movement.unitPrice);
      totalSaidaValor += movement.totalValue; // Adiciona ao total de saída
    }

    currentUnitCost = (currentQuantity > 0) ? (currentTotalValue / currentQuantity) : 0;

    tableData.push({
      id: movement.id,
      date: movement.date,
      type: movement.type === 'in' ? 'Compra' : 'Venda',
      qty_entrada: movement.type === 'in' ? movement.quantity : '-',
      custo_unit_entrada: movement.type === 'in' ? movement.unitPrice : '-',
      valor_total_entrada: movement.type === 'in' ? movement.totalValue : '-',
      qty_saida: movement.type === 'out' ? movement.quantity : '-',
      custo_unit_saida: movement.type === 'out' ? movement.unitPrice : '-',
      valor_total_saida: movement.type === 'out' ? movement.totalValue : '-',
      saldo_qty: currentQuantity,
      saldo_custo_unit: currentUnitCost,
      saldo_valor_total: currentTotalValue,
    });
  });

  // Adiciona a linha de total
  tableData.push({
    id: 'total-row',
    type: 'Total',
    qty_entrada: '-',
    custo_unit_entrada: '-',
    valor_total_entrada: totalEntradaValor,
    qty_saida: '-',
    custo_unit_saida: '-',
    valor_total_saida: totalSaidaValor,
    saldo_qty: '-',
    saldo_custo_unit: '-',
    saldo_valor_total: currentTotalValue, // O saldo final total é o último saldo acumulado
    isTotalRow: true // Propriedade para identificar a linha de total
  });


  return tableData;
});

const getProductName = (productId: string) => {
  return productStore.getProductById(productId)?.name || 'Produto Desconhecido';
};

const getJournalEntryDescription = (journalEntryId?: string) => {
  if (!journalEntryId) return 'N/A';
  return journalEntryStore.getJournalEntryById(journalEntryId)?.description || 'Lançamento Contábil Desconhecido';
};

// Funções de teste
const addTestPurchase = () => {
  const productId = products.value[0]?.id;
  if (!productId) { alert('Nenhum produto disponível.'); return; }
  const newMovement: StockMovement = {
    id: Date.now().toString() + '-test-compra', date: '2025-01-05', type: 'in', productId: productId,
    quantity: 100, unitPrice: 5.00, totalValue: 100 * 5.00, journalEntryId: 'test-journal-entry-1'
  };
  stockControlStore.addMovement(newMovement);
};

const addTestSale = () => {
  const productId = products.value[0]?.id;
  if (!productId) { alert('Nenhum produto disponível.'); return; }
  const newMovement: StockMovement = {
    id: Date.now().toString() + '-test-venda', date: '2025-01-10', type: 'out', productId: productId,
    quantity: 50, unitPrice: 0, totalValue: 0, journalEntryId: 'test-journal-entry-2'
  };
  stockControlStore.addMovement(newMovement);
};
</script>

<template>
  <div class="stock-control-container">
    <h1>Ficha de Controle de Estoque (Custo Médio)</h1>

    <div class="product-selection">
      <label for="product-select">Selecione o Produto:</label>
      <select id="product-select" v-model="selectedProductId">
        <option value="">-- Selecione um produto --</option>
        <option v-for="product in products" :key="product.id" :value="product.id">
          {{ product.name }}
        </option>
      </select>
    </div>

    <div v-if="selectedProductId && currentBalanceForSelectedProduct" class="stock-summary">
      <h2>Resumo Final do Estoque para {{ getProductName(selectedProductId) }}</h2>
      <p>Quantidade Atual: <strong>{{ currentBalanceForSelectedProduct.quantity }} unds</strong></p>
      <p>Custo Médio Unitário: <strong>R$ {{ currentBalanceForSelectedProduct.unitCost.toFixed(2) }}</strong></p>
      <p>Valor Total em Estoque: <strong>R$ {{ currentBalanceForSelectedProduct.totalValue.toFixed(2) }}</strong></p>
    </div>

    <div v-if="selectedProductId" class="stock-movements-table">
      <h2>Movimentos de Estoque para {{ getProductName(selectedProductId) }}</h2>
      <table v-if="stockLedgerTable.length > 0">
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
          <tr v-for="row in stockLedgerTable" :key="row.id" :class="{ 'total-row': row.isTotalRow }">
            <td>{{ row.type }}</td>
            <td>{{ row.qty_entrada }}</td>
            <td>{{ typeof row.custo_unit_entrada === 'number' ? 'R$ ' + row.custo_unit_entrada.toFixed(2) : row.custo_unit_entrada }}</td>
            <td>{{ typeof row.valor_total_entrada === 'number' ? 'R$ ' + row.valor_total_entrada.toFixed(2) : row.valor_total_entrada }}</td>
            <td>{{ row.qty_saida }}</td>
            <td>{{ typeof row.custo_unit_saida === 'number' ? 'R$ ' + row.custo_unit_saida.toFixed(2) : row.custo_unit_saida }}</td>
            <td>{{ typeof row.valor_total_saida === 'number' ? 'R$ ' + row.valor_total_saida.toFixed(2) : row.valor_total_saida }}</td>
            <td>{{ row.saldo_qty }}</td>
            <td>{{ typeof row.saldo_custo_unit === 'number' ? 'R$ ' + row.saldo_custo_unit.toFixed(2) : row.saldo_custo_unit }}</td>
            <td>{{ typeof row.saldo_valor_total === 'number' ? 'R$ ' + row.saldo_valor_total.toFixed(2) : row.saldo_valor_total }}</td>
          </tr>
        </tbody>
      </table>
      <p v-else>Nenhum movimento registrado para este produto ainda.</p>
    </div>
    <p v-else class="select-product-prompt">Por favor, selecione um produto para visualizar sua ficha de estoque.</p>

    <div class="test-buttons">
      <h3>Testes Manuais (apenas para desenvolvimento):</h3>
      <button @click="addTestPurchase">Adicionar Compra de Teste (Produto X, 100 unds @ R$5.00)</button>
      <button @click="addTestSale">Adicionar Venda de Teste (Produto X, 50 unds)</button>
    </div>
  </div>
</template>

<style scoped>
.stock-control-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  font-family: Arial, sans-serif;
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
}

.product-selection {
  margin-bottom: 25px;
  text-align: center;
}

.product-selection label {
  font-weight: bold;
  margin-right: 10px;
  color: #555;
}

.product-selection select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  min-width: 200px;
}

.stock-summary, .stock-movements-table {
  background-color: #f9f9f9;
  padding: 25px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.stock-summary h2, .stock-movements-table h2 {
  color: #555;
  margin-bottom: 15px;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.stock-summary p {
  font-size: 1.1rem;
  margin: 8px 0;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
}

th, td {
  border: 1px solid #e0e0e0;
  padding: 10px;
  text-align: left;
  font-size: 0.85rem;
}

th {
  background-color: #eef;
  font-weight: bold;
  color: #444;
  text-align: center;
}

tbody tr:nth-child(even) {
  background-color: #f6f6f6;
}

.total-row { /* Novo estilo para a linha de total */
  font-weight: bold;
  background-color: #eef; /* Mesma cor do cabeçalho */
  border-top: 2px solid #ccc; /* Borda superior para destacar */
}
.total-row td {
  color: #333;
}

.select-product-prompt {
  text-align: center;
  color: #888;
  font-style: italic;
  margin-top: 50px;
}

.test-buttons {
  margin-top: 40px;
  text-align: center;
  padding: 20px;
  border-top: 1px dashed #ccc;
}

.test-buttons button {
  background-color: #17a2b8;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 4px;
  cursor: pointer;
  margin: 5px;
  transition: background-color 0.2s;
}

.test-buttons button:hover {
  background-color: #138496;
}
</style>
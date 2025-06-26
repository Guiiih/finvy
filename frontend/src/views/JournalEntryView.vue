<template>
  <div class="journal-entry-view">
    <h1>Lançamentos Contábeis</h1>

    <div class="controls">
      <button @click="showAddEntryForm = !showAddEntryForm">
        {{ showAddEntryForm ? 'Fechar Formulário' : 'Novo Lançamento' }}
      </button>
      
      <button @click="resetAllData">Resetar Todos os Dados</button>
    </div>

    <form v-if="showAddEntryForm" @submit.prevent="submitEntry" class="journal-entry-form">
      <h2>{{ editingEntryId ? 'Editar Lançamento' : 'Adicionar Novo Lançamento' }}</h2>
      <div class="form-group">
        <label for="entry-date">Data:</label>
        <input type="date" id="entry-date" v-model="newEntryDate" required />
      </div>
      <div class="form-group">
        <label for="entry-description">Descrição:</label>
        <input type="text" id="entry-description" v-model="newEntryDescription" placeholder="Descrição do lançamento" required />
      </div>

      <h3>Linhas do Lançamento:</h3>
      <div v-for="(line, index) in newEntryLines" :key="index" class="entry-line">
        <select v-model="line.accountId" required>
          <option value="" disabled>Selecione a Conta</option>
          <optgroup v-for="type in accountStore.accountTypes" :label="type" :key="type">
            <option v-for="account in accountStore.getAccountsByType(type)" :value="account.id" :key="account.id">
              {{ account.name }}
            </option>
          </optgroup>
        </select>
        <input type="number" v-model.number="line.debit" placeholder="Débito" step="0.01" min="0" :disabled="line.credit > 0" />
        <input type="number" v-model.number="line.credit" placeholder="Crédito" step="0.01" min="0" :disabled="line.debit > 0" />
        <button type="button" @click="removeLine(index)">Remover</button>
      </div>
      <button type="button" @click="addLine">Adicionar Linha</button>

      <div class="balance-info">
        <p :class="{ 'positive': totalDebits === totalCredits, 'negative': totalDebits !== totalCredits }">
          Total Débitos: R$ {{ totalDebits.toFixed(2) }}
        </p>
        <p :class="{ 'positive': totalDebits === totalCredits, 'negative': totalDebits !== totalCredits }">
          Total Créditos: R$ {{ totalCredits.toFixed(2) }}
        </p>
        <p :class="{ 'positive': totalDebits === totalCredits, 'negative': totalDebits !== totalCredits }">
          Diferença: R$ {{ (totalDebits - totalCredits).toFixed(2) }}
        </p>
      </div>

      <button type="submit" :disabled="totalDebits !== totalCredits">
        {{ editingEntryId ? 'Atualizar Lançamento' : 'Registrar Lançamento' }}
      </button>
      <button type="button" @click="cancelEdit" v-if="editingEntryId">Cancelar</button>
    </form>

    <h2>Lançamentos Registrados</h2>
    <table>
      <thead>
        <tr>
          <th>Data</th>
          <th>Descrição</th>
          <th>Débitos</th>
          <th>Créditos</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        <template v-for="entry in sortedJournalEntries" :key="entry.id">
          <tr class="entry-summary">
            <td>{{ entry.date }}</td>
            <td>{{ entry.description }}</td>
            <td>R$ {{ calculateTotal(entry.lines, 'debit').toFixed(2) }}</td>
            <td>R$ {{ calculateTotal(entry.lines, 'credit').toFixed(2) }}</td>
            <td>
              <button @click="editEntry(entry)">Editar</button>
              <button @click="deleteEntry(entry.id)">Excluir</button>
              <button @click="toggleDetails(entry.id)">
                {{ showDetails[entry.id] ? 'Ocultar Detalhes' : 'Mostrar Detalhes' }}
              </button>
            </td>
          </tr>
          <tr v-if="showDetails[entry.id]" class="entry-details">
            <td colspan="5">
              <table>
                <thead>
                  <tr>
                    <th>Conta</th>
                    <th>Tipo</th>
                    <th>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(line, lineIndex) in entry.lines" :key="lineIndex">
                    <td>{{ getAccountName(line.accountId) }}</td>
                    <td>{{ line.debit > 0 ? 'Débito' : 'Crédito' }}</td>
                    <td>R$ {{ (line.debit || line.credit || 0).toFixed(2) }}</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useJournalEntryStore } from '../stores/journalEntryStore';
import { useAccountStore } from '../stores/accountStore';
import { useProductStore } from '../stores/productStore';
import { useStockControlStore } from '../stores/stockControlStore';
import type { JournalEntry, EntryLine as JournalEntryLine } from '../types';

const journalEntryStore = useJournalEntryStore();
const accountStore = useAccountStore();
const productStore = useProductStore();
const stockControlStore = useStockControlStore();

const showAddEntryForm = ref(false);
const newEntryDate = ref('');
const newEntryDescription = ref('');
const newEntryLines = ref<JournalEntryLine[]>([
  { accountId: '', debit: 0, credit: 0, amount: 0 },
  { accountId: '', debit: 0, credit: 0, amount: 0 },
]);
const editingEntryId = ref<string | null>(null);
const showDetails = ref<{ [key: string]: boolean }>({});

// Computed properties for totals
const totalDebits = computed(() =>
  newEntryLines.value
    .reduce((sum, line) => sum + (line.debit || 0), 0)
);

const totalCredits = computed(() =>
  newEntryLines.value
    .reduce((sum, line) => sum + (line.credit || 0), 0)
);

const sortedJournalEntries = computed(() => {
  return [...journalEntryStore.journalEntries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
});

// Watch for changes in journal entries to update stock control
watch(() => journalEntryStore.journalEntries, (newEntries, oldEntries) => {
  // Simple re-processing of all movements for demonstration.
  // In a real app, you might want more granular updates (e.g., only for new/changed entries).
  stockControlStore.movements = []; // Clear existing movements
  stockControlStore.balances = []; // Clear existing balances
  newEntries.forEach(entry => handleStockMovementFromJournalEntry(entry));
}, { deep: true, immediate: true });

// --- Helper Functions ---
function resetForm() {
  newEntryDate.value = new Date().toISOString().split('T')[0];
  newEntryDescription.value = '';
  newEntryLines.value = [
    { accountId: '', debit: 0, credit: 0, amount: 0 },
    { accountId: '', debit: 0, credit: 0, amount: 0 },
  ];
  editingEntryId.value = null;
  showAddEntryForm.value = false;
}

function addLine() {
  newEntryLines.value.push({ accountId: '', debit: 0, credit: 0, amount: 0 });
}

function removeLine(index: number) {
  newEntryLines.value.splice(index, 1);
}

function calculateTotal(lines: JournalEntryLine[], type: 'debit' | 'credit'): number {
  return lines.reduce((sum, line) => {
    if (type === 'debit') {
      return sum + (line.debit || 0);
    } else {
      return sum + (line.credit || 0);
    }
  }, 0);
}

function getAccountName(accountId: string): string {
  return accountStore.getAccountById(accountId)?.name || 'Conta Desconhecida';
}

function toggleDetails(id: string) {
  showDetails.value[id] = !showDetails.value[id];
}

// --- Lógica de Integração com Controle de Estoque ---
function handleStockMovementFromJournalEntry(entry: JournalEntry) {
  // A lógica de controle de estoque agora é centralizada no stockControlStore
  // que observa as mudanças em journalEntryStore.journalEntries.
  // Esta função agora serve apenas para garantir que os dados de estoque
  // (productId, quantity, unitCost) estejam presentes nas EntryLine's
  // quando um lançamento é criado, se aplicável.
  // A inferência de tipo de movimento ('in'/'out') e o cálculo do CMV
  // são feitos dentro do stockControlStore.

  // Exemplo de como você pode verificar se uma linha de lançamento
  // contém informações de estoque relevantes para o stockControlStore
  entry.lines.forEach(line => {
    if (line.productId && (line.quantity !== undefined) && (line.unitCost !== undefined)) {
      console.log(`Linha de lançamento com dados de estoque identificada para o produto ${line.productId}.`);
    }
  });
}

// --- Funções de Exemplo (para simular dados) ---


// --- Main Action Functions (can call helpers above) ---
async function submitEntry() {
  if (totalDebits.value !== totalCredits.value) {
    alert('Débitos e Créditos devem ser iguais!');
    return;
  }

  if (newEntryLines.value.some(line => line.amount <= 0)) {
    alert('Todos os valores devem ser maiores que zero.');
    return;
  }

  const newEntry: JournalEntry = {
    id: editingEntryId.value || `JE-${Date.now()}`,
    date: newEntryDate.value,
    description: newEntryDescription.value,
    lines: newEntryLines.value.map(line => ({
      accountId: line.accountId,
      debit: line.debit || 0,
      credit: line.credit || 0,
      productId: line.productId,
      quantity: line.quantity,
      unitCost: line.unitCost,
      amount: line.amount || line.debit || line.credit || 0,
    })),
    user_id: "00000000-0000-0000-0000-000000000000", // Adicionado user_id
  };

  if (editingEntryId.value) {
    journalEntryStore.updateEntry(newEntry);
    console.log('Lançamento atualizado:', newEntry);
  } else {
    journalEntryStore.addJournalEntry(newEntry); // Corrected action name
    console.log('Novo lançamento adicionado:', newEntry);
  }
  resetForm();
}

function editEntry(entry: JournalEntry) {
  showAddEntryForm.value = true;
  editingEntryId.value = entry.id;
  newEntryDate.value = entry.date;
  newEntryLines.value = entry.lines.map(line => ({
    accountId: line.accountId,
    debit: line.debit || 0,
    credit: line.credit || 0,
    productId: line.productId,
    quantity: line.quantity,
    unitCost: line.unitCost,
    amount: line.amount || line.debit || line.credit || 0,
  }));
}

function cancelEdit() {
  resetForm();
}

function deleteEntry(id: string) {
  if (confirm('Tem certeza que deseja excluir este lançamento?')) {
    journalEntryStore.deleteEntry(id);
    if (editingEntryId.value === id) {
      resetForm();
    }
    console.log('Lançamento excluído:', id);
  }
}

const resetAllData = () => {
  if (confirm('Tem certeza que deseja resetar todos os dados (lançamentos, contas, produtos, estoque)?')) {
    // As stores agora interagem com a API, então $reset() não é mais aplicável para limpar o backend.
    // Para limpar o backend, seria necessário um endpoint de API específico para isso.
    // Por enquanto, apenas resetamos o formulário e logamos a intenção.
    resetForm();
    console.log('Todos os dados foram resetados. Para limpar o banco de dados, use as ferramentas do Supabase ou implemente um endpoint de API para isso.');
  }
};

onMounted(() => {
  resetForm();
});
</script>

<style scoped>
.journal-entry-view {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  font-family: Arial, sans-serif;
}

h1, h2, h3 {
  color: #333;
}

.controls {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.controls button {
  padding: 10px 15px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.controls button:hover {
  background-color: #0056b3;
}

.controls button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.journal-entry-form {
  background-color: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input[type="date"],
.form-group input[type="text"] {
  width: calc(100% - 20px);
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.entry-line {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.entry-line select,
.entry-line input[type="number"] {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.entry-line select {
  flex: 2;
  min-width: 150px;
}

.entry-line input[type="number"] {
  flex: 1;
  min-width: 100px;
}

.entry-line button {
  padding: 8px 12px;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.entry-line button:hover {
  background-color: #c82333;
}

.balance-info {
  margin-top: 20px;
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 5px;
  background-color: #e9ecef;
}

.balance-info p {
  margin: 5px 0;
  font-weight: bold;
}

.balance-info .positive {
  color: green;
}

.balance-info .negative {
  color: red;
}

.journal-entry-form button[type="submit"],
.journal-entry-form button[type="button"]:not(.entry-line button) {
  padding: 10px 20px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin-top: 20px;
  margin-right: 10px;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.journal-entry-form button[type="submit"]:hover,
.journal-entry-form button[type="button"]:not(.entry-line button):hover {
  background-color: #218838;
}

.journal-entry-form button[type="submit"]:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

th, td {
  border: 1px solid #ddd;
  padding: 12px;
  text-align: left;
}

th {
  background-color: #f2f2f2;
  font-weight: bold;
  color: #333;
}

.entry-summary td {
  background-color: #ffffff;
}

.entry-details td {
  background-color: #f0f8ff;
  padding: 10px 20px;
}

.entry-details table {
  width: 100%;
  margin: 0;
  box-shadow: none;
}

.entry-details th, .entry-details td {
  padding: 8px;
  font-size: 0.9em;
}

.entry-summary button {
  padding: 6px 10px;
  margin-right: 5px;
  background-color: #17a2b8;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.entry-summary button:hover {
  background-color: #138496;
}

.entry-summary button:last-child {
  background-color: #6c757d;
}

.entry-summary button:last-child:hover {
  background-color: #5a6268;
}

.entry-summary button:nth-child(2) { /* Delete button */
  background-color: #dc3545;
}

.entry-summary button:nth-child(2):hover {
  background-color: #c82333;
}
</style>
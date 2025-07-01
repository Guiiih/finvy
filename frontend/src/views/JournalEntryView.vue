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
        <select v-model="line.account_id" @change="handleAccountChange(line)" required>
          <option value="" disabled>Selecione a Conta</option>
          <optgroup v-for="type in accountStore.accountTypes" :label="type" :key="type">
            <option v-for="account in accountStore.getAccountsByType(type)" :value="account.id" :key="account.id">
              {{ account.name }}
            </option>
          </optgroup>
        </select>
        <select v-model="line.type" required>
          <option value="">Tipo</option>
          <option value="debit">Débito</option>
          <option value="credit">Crédito</option>
        </select>
                <input
                  type="number"
                  :value="line.amount"
                  @input="event => { const target = event.target as HTMLInputElement | null; line.amount = target && target.value ? parseFloat(target.value) || 0 : 0; }"
                  placeholder="Valor"
                  step="0.01"
                  min="0"
                  required
                />
        
        <select v-model="line.product_id" @change="handleProductChange(line)" class="product-select">
            <option value="" :disabled="true">Selecione o Produto (Opcional)</option>
            <option v-for="product in productStore.products" :value="product.id" :key="product.id">
                {{ product.name }}
            </option>
        </select>
        <input
          v-if="line.product_id"
          type="number"
          v-model.number="line.quantity"
          placeholder="Qtd."
          step="1"
          min="0"
          :required="!!line.product_id"
          @input="calculateLineTotals(line)"
        />
        <input
          v-if="line.product_id"
          type="number"
          v-model.number="line.unit_cost"
          placeholder="Custo Unit."
          step="0.01"
          min="0"
          :required="!!line.product_id"
          @input="calculateLineTotals(line)"
        />
        <input
          v-if="line.product_id"
          type="number"
          v-model.number="line.icms_rate"
          placeholder="ICMS %"
          step="0.01"
          min="0"
          @input="calculateLineTotals(line)"
        />
        <span v-if="line.product_id">Bruto: R$ {{ (line.total_gross || 0).toFixed(2) }}</span>
        <span v-if="line.product_id">ICMS: R$ {{ (line.icms_value || 0).toFixed(2) }}</span>
        <span v-if="line.product_id">Líquido: R$ {{ (line.total_net || 0).toFixed(2) }}</span>
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

      <button type="submit" :disabled="totalDebits !== totalCredits || journalEntryStore.loading">
        {{ editingEntryId ? 'Atualizar Lançamento' : 'Registrar Lançamento' }}
      </button>
      <button type="button" @click="cancelEdit" v-if="editingEntryId">Cancelar</button>
    </form>

    <h2>Lançamentos Registrados</h2>
    <p v-if="journalEntryStore.loading">Carregando lançamentos...</p>
    <p v-else-if="journalEntryStore.error" class="error-message">{{ journalEntryStore.error }}</p>
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
            <td>{{ entry.entry_date }}</td>
            <td>{{ entry.description }}</td>
            <td>R$ {{ calculateTotal(entry.lines, 'debit').toFixed(2) }}</td>
            <td>R$ {{ calculateTotal(entry.lines, 'credit').toFixed(2) }}</td>
            <td>
              <!-- Edição e exclusão direta desabilitadas para manter a integridade contábil. 
                   Correções devem ser feitas com lançamentos de estorno. -->
              <button disabled title="Edição desabilitada para lançamentos registrados">Editar</button>
              <button disabled title="Exclusão desabilitada para lançamentos registrados">Excluir</button>
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
                    <th>Produto</th>
                    <th>Cód. Conta</th> </tr>
                </thead>
                <tbody>
                  <tr v-for="(line, lineIndex) in entry.lines" :key="lineIndex">
                    <td>{{ getAccountName(line.account_id) }}</td>
                    <td>{{ line.type === 'debit' ? 'Débito' : 'Crédito' }}</td>
                    <td>R$ {{ line.amount.toFixed(2) }}</td>
                    <td>{{ getProductName(line.product_id) }}</td>
                    <td>{{ getAccountCode(line.account_id) }}</td> </tr>
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
import { ref, computed } from 'vue';
import { useJournalEntryStore } from '@/stores/journalEntryStore';
import { useAccountStore } from '@/stores/accountStore';
import { useProductStore } from '@/stores/productStore';

import type { JournalEntry, EntryLine as JournalEntryLine, Product } from '@/types/index';

const journalEntryStore = useJournalEntryStore();
const accountStore = useAccountStore();
const productStore = useProductStore();

const showAddEntryForm = ref(false);
const newEntryDate = ref('');
const newEntryDescription = ref('');
const editingEntryId = ref<string | null>(null);

// Add this line to declare newEntryLines as a ref
type EntryLine = {
  account_id: string;
  type: 'debit' | 'credit';
  amount: number;
  product_id?: string;
  quantity?: number;
  unit_cost?: number;
  icms_rate?: number; // Adicionado icms_rate
  total_gross?: number;
  icms_value?: number;
  total_net?: number;
};

const newEntryLines = ref<EntryLine[]>([
  { account_id: '', type: 'debit', amount: 0, product_id: '', quantity: undefined, unit_cost: undefined, icms_rate: undefined, total_gross: undefined, icms_value: undefined, total_net: undefined }
]);

const totalDebits = computed(() =>
  newEntryLines.value.reduce((sum, line) => line.type === 'debit' ? sum + (line.amount || 0) : sum, 0)
);

const totalCredits = computed(() =>
  newEntryLines.value.reduce((sum, line) => line.type === 'credit' ? sum + (line.amount || 0) : sum, 0)
);

function calculateLineTotals(line: EntryLine) {
  const icms_rate = line.icms_rate || 0;

  line.total_gross = line.amount; // Use the amount entered by the user as the gross value
  line.icms_value = line.total_gross * (icms_rate / 100);
  line.total_net = line.total_gross - line.icms_value;
}

function resetForm() {
  newEntryDate.value = new Date().toISOString().split('T')[0];
  newEntryDescription.value = '';
  newEntryLines.value = [
    { account_id: '', type: 'debit', amount: 0, product_id: '', quantity: undefined, unit_cost: undefined, icms_rate: undefined, total_gross: undefined, icms_value: undefined, total_net: undefined },
    { account_id: '', type: 'credit', amount: 0, product_id: '', quantity: undefined, unit_cost: undefined, icms_rate: undefined, total_gross: undefined, icms_value: undefined, total_net: undefined }
  ];
  editingEntryId.value = null;
}

function addLine() {
  newEntryLines.value.push({ account_id: '', type: 'debit', amount: 0, product_id: '', quantity: undefined, unit_cost: undefined, icms_rate: undefined, total_gross: undefined, icms_value: undefined, total_net: undefined });
}

function removeLine(index: number) {
  newEntryLines.value.splice(index, 1);
}

function calculateTotal(lines: JournalEntryLine[], type: 'debit' | 'credit'): number {
  return lines.reduce((sum, line) => {
    if (line.type === type) {
      return sum + (line.amount || 0);
    }
    return sum;
  }, 0);
}

function getAccountName(accountId: string): string {
  return accountStore.getAccountById(accountId)?.name || 'Conta Desconhecida';
}

function getAccountCode(accountId: string): number | undefined {
  return accountStore.getAccountById(accountId)?.code;
}

function getProductName(productId: string | undefined): string {
  if (!productId) return '-';
  return productStore.getProductById(productId)?.name || 'Produto Desconhecido';
}

const showDetails = ref<{ [key: string]: boolean }>({});

function toggleDetails(id: string) {
  showDetails.value[id] = !showDetails.value[id];
}

function handleAccountChange(line: EntryLine) {
  line.product_id = '';
  line.quantity = undefined;
  line.unit_cost = undefined;
  line.icms_rate = undefined;
  line.total_gross = undefined;
  line.icms_value = undefined;
  line.total_net = undefined;
}

function handleProductChange(line: EntryLine) {
  const product: Product | undefined = productStore.getProductById(line.product_id || '');
  if (product) {
    line.unit_cost = product.unit_cost;
    line.icms_rate = product.icms_rate || 0;
    line.quantity = 1;
    calculateLineTotals(line);
  } else {
    line.unit_cost = undefined;
    line.icms_rate = undefined;
    line.quantity = undefined;
    line.total_gross = undefined;
    line.icms_value = undefined;
    line.total_net = undefined;
  }
}

async function submitEntry() {
  if (totalDebits.value !== totalCredits.value) {
    alert('Débitos e Créditos devem ser iguais!');
    return;
  }

  const validLines = newEntryLines.value.filter(line => line.account_id);

  if (validLines.length < 2) {
    alert('Um lançamento deve ter pelo menos duas linhas válidas.');
    return;
  }

  for (const line of validLines) {
    if (line.product_id) {
      if (line.quantity === undefined || line.quantity <= 0 || line.unit_cost === undefined || line.unit_cost <= 0) {
        alert('Para linhas com produto, Quantidade e Custo Unitário são obrigatórios e devem ser maiores que zero.');
        return;
      }
    }
  }

  const newEntry: Omit<JournalEntry, 'lines' | 'id'> & { id?: string, lines: Omit<JournalEntryLine, 'id'>[] } = {
    entry_date: newEntryDate.value,
    description: newEntryDescription.value,
    lines: validLines.map(line => ({
      account_id: line.account_id,
      type: line.type,
      amount: line.amount,
      product_id: line.product_id || undefined,
      quantity: line.quantity || undefined,
      unit_cost: line.unit_cost || undefined,
      icms_rate: line.icms_rate || undefined,
      total_gross: line.total_gross || undefined,
      icms_value: line.icms_value || undefined,
      total_net: line.total_net || undefined,
    })),
  };
  if (editingEntryId.value) {
    newEntry.id = editingEntryId.value;
  }

  try {
    if (editingEntryId.value) {
      await journalEntryStore.updateEntry(newEntry as JournalEntry);
      alert('Lançamento atualizado com sucesso!');
      console.log('Lançamento atualizado:', newEntry);
    } else {
      await journalEntryStore.addJournalEntry(newEntry as JournalEntry);
      alert('Novo lançamento adicionado com sucesso!');
      console.log('Novo lançamento adicionado:', newEntry);
    }
    resetForm();
  } catch (_error: unknown) {
    console.error("Erro ao registrar lançamento:", _error);
    alert(journalEntryStore.error || 'Erro ao registrar lançamento.');
  }
}

function editEntry(entry: JournalEntry) {
  showAddEntryForm.value = true;
  editingEntryId.value = entry.id;
  newEntryDate.value = entry.entry_date;
  newEntryDescription.value = entry.description;
  newEntryLines.value = entry.lines.map(line => ({
    account_id: line.account_id,
    type: line.type,
    amount: line.amount,
    product_id: line.product_id || '',
    quantity: line.quantity || undefined,
    unit_cost: line.unit_cost || undefined,
    icms_rate: line.icms_rate || undefined,
    total_gross: line.total_gross || undefined,
    icms_value: line.icms_value || undefined,
    total_net: line.total_net || undefined,
  }));
}

function cancelEdit() {
  resetForm();
}

async function deleteEntry(id: string) {
  if (confirm('Tem certeza que deseja excluir este lançamento?')) {
    try {
      await journalEntryStore.deleteEntry(id);
      if (editingEntryId.value === id) {
        resetForm();
      }
      alert('Lançamento excluído com sucesso!');
      console.log('Lançamento excluído:', id);
    } catch (_error: unknown) {
    console.error("Erro ao excluir lançamento:", _error);
    alert(journalEntryStore.error || 'Erro ao excluir lançamento.');
  }
  }
}

const resetAllData = () => {
  if (confirm('Tem certeza que deseja resetar todos os dados? Esta ação não pode ser desfeita sem restaurar o banco de dados manualmente.')) {
    alert('A funcionalidade de resetar todos os dados do banco de dados não está implementada via UI. Por favor, gerencie os dados diretamente no Supabase.');
    console.warn('Tentativa de resetar todos os dados. Implementação de reset de DB necessária.');
  }
};

// Adiciona a propriedade computada para os lançamentos ordenados
const sortedJournalEntries = computed(() => {
  // Ordena por data decrescente, depois por id decrescente
  return [...journalEntryStore.journalEntries].sort((a, b) => {
    if (a.entry_date > b.entry_date) return -1;
    if (a.entry_date < b.entry_date) return 1;
    return b.id.localeCompare(a.id);
  });
});
</script>

<style scoped>
/* O CSS pode precisar de pequenos ajustes nos flexboxes ou larguras */
/* para garantir que os campos restantes ocupem bem o espaço após a remoção. */
/* O estilo abaixo é o original, você pode ajustá-lo conforme necessário. */

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
.entry-line input[type="number"],
.entry-line input[type="text"] {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

/* Ajuste o flex para as colunas restantes se necessário */
.entry-line select:not(.product-select) {
  flex: 2;
  min-width: 150px;
}

.entry-line input[type="number"] {
  flex: 1;
  min-width: 100px;
}

.entry-line .product-select {
  flex: 2; /* Pode ser ajustado para ocupar mais espaço */
  min-width: 180px;
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

.entry-summary button:nth-child(2) {
  background-color: #dc3545;
}

.entry-summary button:nth-child(2):hover {
  background-color: #c82333;
}
</style>
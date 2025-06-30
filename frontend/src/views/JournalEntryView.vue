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
        <select v-model="line.accountId" @change="handleAccountChange(line)" required>
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
        <input type="number" v-model.number="line.amount" placeholder="Valor" step="0.01" min="0" required />
        
        <select v-model="line.productId" :disabled="!line.accountId" @change="handleProductChange(line)" class="product-select">
            <option value="" :disabled="true">Selecione o Produto (Opcional)</option>
            <option v-for="product in productStore.products" :value="product.id" :key="product.id">
                {{ product.name }}
            </option>
        </select>
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
                    <th>Produto</th> </tr>
                </thead>
                <tbody>
                  <tr v-for="(line, lineIndex) in entry.lines" :key="lineIndex">
                    <td>{{ getAccountName(line.accountId) }}</td>
                    <td>{{ line.type === 'debit' ? 'Débito' : 'Crédito' }}</td>
                    <td>R$ {{ line.amount.toFixed(2) }}</td>
                    <td>{{ getProductName(line.productId) }}</td> </tr>
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

watch(newEntryDescription, (newValue) => {
  parseProductFromDescription(newValue);
});

async function parseProductFromDescription(description: string) {
  const regex = /(\d+)\s*unds\s*de\s*produto\s+([^,]+)/i; // Regex para "QUANTIDADE unds de produto NOME_DO_PRODUTO"
  const match = description.match(regex);

  if (match) {
    const quantity = parseFloat(match[1]);
    const productName = match[2].trim();

    const product = productStore.products.find(p => p.name.toLowerCase() === productName.toLowerCase()) as Product;

    if (product) {
      const unit_cost = product.unit_cost;
      const icms_rate = product.icms_rate || 0; // Assume 0 se não definido

      const total_gross = quantity * unit_cost;
      const icms_value = total_gross * (icms_rate / 100);
      const total_net = total_gross - icms_value;

      // Atualiza a primeira linha do lançamento com os dados do produto
      // Assumimos que a descrição do produto se refere à primeira linha
      if (newEntryLines.value.length > 0) {
        newEntryLines.value[0].productId = product.id;
        newEntryLines.value[0].quantity = quantity;
        newEntryLines.value[0].unit_cost = unit_cost;
        newEntryLines.value[0].total_gross = total_gross;
        newEntryLines.value[0].icms_value = icms_value;
        newEntryLines.value[0].total_net = total_net;
        // O amount da linha pode ser o total_gross ou total_net dependendo da conta
        // Por enquanto, vamos manter o amount como o valor que o usuário digita,
        // mas os campos calculados estarão disponíveis.
        // Se a intenção é que o amount seja preenchido automaticamente, precisaremos de mais lógica.
      }
    } else {
      // Se o produto não for encontrado, limpa os campos relacionados ao produto na primeira linha
      if (newEntryLines.value.length > 0) {
        newEntryLines.value[0].productId = undefined;
        newEntryLines.value[0].quantity = undefined;
        newEntryLines.value[0].unit_cost = undefined;
        newEntryLines.value[0].total_gross = undefined;
        newEntryLines.value[0].icms_value = undefined;
        newEntryLines.value[0].total_net = undefined;
      }
    }
  } else {
    // Se a descrição não corresponder ao padrão, limpa os campos relacionados ao produto na primeira linha
    if (newEntryLines.value.length > 0) {
      newEntryLines.value[0].productId = undefined;
      newEntryLines.value[0].quantity = undefined;
      newEntryLines.value[0].unit_cost = undefined;
      newEntryLines.value[0].total_gross = undefined;
      newEntryLines.value[0].icms_value = undefined;
      newEntryLines.value[0].total_net = undefined;
    }
  }
}

const newEntryLines = ref<JournalEntryLine[]>([
  { accountId: '', type: 'debit', amount: 0, productId: '', quantity: undefined, unit_cost: undefined },
  { accountId: '', type: 'credit', amount: 0, productId: '', quantity: undefined, unit_cost: undefined },
]);
const editingEntryId = ref<string | null>(null);
const showDetails = ref<{ [key: string]: boolean }>({});

const totalDebits = computed(() =>
  newEntryLines.value
    .reduce((sum, line) => sum + (line.type === 'debit' ? line.amount : 0), 0)
);

const totalCredits = computed(() =>
  newEntryLines.value
    .reduce((sum, line) => sum + (line.type === 'credit' ? line.amount : 0), 0)
);

const sortedJournalEntries = computed(() => {
  return [...journalEntryStore.journalEntries].sort((a, b) => new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime());
});

onMounted(async () => {
  resetForm();
  await accountStore.fetchAccounts();
  await productStore.fetchProducts();
  await journalEntryStore.fetchJournalEntries();
});

function resetForm() {
  newEntryDate.value = new Date().toISOString().split('T')[0];
  newEntryDescription.value = '';
  newEntryLines.value = [
    { accountId: '', type: 'debit', amount: 0, productId: '', quantity: undefined, unit_cost: undefined },
    { accountId: '', type: 'credit', amount: 0, productId: '', quantity: undefined, unit_cost: undefined },
  ];
  editingEntryId.value = null;
}

function addLine() {
  newEntryLines.value.push({ accountId: '', type: 'debit', amount: 0, productId: '', quantity: undefined, unit_cost: undefined });
}

function removeLine(index: number) {
  newEntryLines.value.splice(index, 1);
}

function calculateTotal(lines: JournalEntryLine[], type: 'debit' | 'credit'): number {
  return lines.reduce((sum, line) => {
    if (line.type === type) {
      return sum + line.amount;
    }
    return sum;
  }, 0);
}

function getAccountName(accountId: string): string {
  return accountStore.getAccountById(accountId)?.name || 'Conta Desconhecida';
}

function getProductName(productId: string | undefined): string {
  if (!productId) return '-';
  return productStore.getProductById(productId)?.name || 'Produto Desconhecido';
}

function toggleDetails(id: string) {
  showDetails.value[id] = !showDetails.value[id];
}

function handleAccountChange(line: JournalEntryLine) {
  line.productId = '';
  // REMOVIDOS: line.quantity = 0; e line.unit_cost = 0;
}

function handleProductChange(line: JournalEntryLine) {
  const product = productStore.getProductById(line.productId || '');
  if (product) {
    line.unit_cost = product.unit_cost;
    // Se você quiser preencher a quantidade automaticamente, adicione a lógica aqui.
    // Por exemplo, line.quantity = 1; ou buscar de algum outro lugar.
  } else {
    line.unit_cost = undefined;
    line.quantity = undefined;
  }
}

async function submitEntry() {
  if (totalDebits.value !== totalCredits.value) {
    alert('Débitos e Créditos devem ser iguais!');
    return;
  }

  const validLines = newEntryLines.value.filter(line => line.accountId);

  if (validLines.length < 2) {
    alert('Um lançamento deve ter pelo menos duas linhas válidas.');
    return;
  }

  // REMOVIDA: A validação que verificava quantity e unit_cost para linhas com produto.
  /*
  for (const line of validLines) {
    if (line.productId) {
      if (line.quantity === undefined || line.quantity <= 0 || line.unit_cost === undefined || line.unit_cost <= 0) {
        alert('Para linhas com produto, Quantidade e Custo Unitário são obrigatórios e devem ser maiores que zero.');
        return;
      }
    }
  }
  */

  const newEntry: JournalEntry = {
    id: editingEntryId.value || `JE-${Date.now()}`,
    entry_date: newEntryDate.value,
    description: newEntryDescription.value,
    lines: validLines.map(line => ({
      accountId: line.accountId,
      type: line.type,
      amount: line.amount,
      productId: line.productId || undefined,
      quantity: line.quantity || undefined,
      unit_cost: line.unit_cost || undefined,
      total_gross: line.total_gross || undefined,
      icms_value: line.icms_value || undefined,
      total_net: line.total_net || undefined,
    })),
  };

  try {
    if (editingEntryId.value) {
      await journalEntryStore.updateEntry(newEntry);
      alert('Lançamento atualizado com sucesso!');
      console.log('Lançamento atualizado:', newEntry);
    } else {
      await journalEntryStore.addJournalEntry(newEntry);
      alert('Novo lançamento adicionado com sucesso!');
      console.log('Novo lançamento adicionado:', newEntry);
    }
    resetForm();
  } catch (error) {
    alert(journalEntryStore.error || 'Erro ao registrar lançamento.');
  }
}

function editEntry(entry: JournalEntry) {
  showAddEntryForm.value = true;
  editingEntryId.value = entry.id;
  newEntryDate.value = entry.entry_date;
  newEntryDescription.value = entry.description;
  newEntryLines.value = entry.lines.map(line => ({
    accountId: line.accountId,
    type: (line.debit && line.debit > 0) ? 'debit' : 'credit',
    amount: (line.debit && line.debit > 0) ? line.debit : (line.credit || 0),
    productId: line.productId || '',
    quantity: line.quantity || undefined,
    unit_cost: line.unit_cost || undefined,
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
    } catch (error) {
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
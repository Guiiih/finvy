<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAccountStore } from '@/stores/accountStore'
import { useProductStore } from '@/stores/productStore'
import type { EntryLine } from '@/types'

const emit = defineEmits(['submit'])

const accountStore = useAccountStore()
const productStore = useProductStore()

const newEntryDate = ref(new Date().toISOString().split('T')[0])
const newEntryDescription = ref('')
const newEntryLines = ref<Partial<EntryLine>[]>([
  { account_id: '', type: 'debit', amount: 0 },
  { account_id: '', type: 'credit', amount: 0 },
])

const totalDebits = computed(() =>
  newEntryLines.value.reduce(
    (sum, line) => (line.type === 'debit' ? sum + (line.amount || 0) : sum),
    0,
  ),
)
const totalCredits = computed(() =>
  newEntryLines.value.reduce(
    (sum, line) => (line.type === 'credit' ? sum + (line.amount || 0) : sum),
    0,
  ),
)
const isBalanced = computed(() => totalDebits.value > 0 && totalDebits.value === totalCredits.value)

function addLine() {
  newEntryLines.value.push({ account_id: '', type: 'debit', amount: 0 })
}

function removeLine(index: number) {
  newEntryLines.value.splice(index, 1)
}

function handleSubmit() {
  if (!isBalanced.value) {
    alert('Os débitos e créditos devem ser iguais e maiores que zero!')
    return
  }
  const entryToSubmit = {
    entry_date: newEntryDate.value,
    description: newEntryDescription.value,
    lines: newEntryLines.value.filter((line) => line.account_id && line.amount),
  }
  emit('submit', entryToSubmit)
}

onMounted(() => {
  accountStore.fetchAccounts()
  productStore.fetchProducts()
})
</script>

<template>
  <form @submit.prevent="handleSubmit" class="journal-entry-form">
    <h2>Adicionar Novo Lançamento</h2>
    <div class="form-group">
      <label for="entry-date">Data:</label>
      <input type="date" id="entry-date" v-model="newEntryDate" required />
    </div>
    <div class="form-group">
      <label for="entry-description">Descrição:</label>
      <input
        type="text"
        id="entry-description"
        v-model="newEntryDescription"
        placeholder="Descrição do lançamento"
        required
      />
    </div>

    <h3>Linhas do Lançamento:</h3>
    <div v-for="(line, index) in newEntryLines" :key="index" class="entry-line">
      <select v-model="line.account_id" required>
        <option value="" disabled>Selecione a Conta</option>
        <optgroup v-for="type in accountStore.accountTypes" :label="type" :key="type">
          <option
            v-for="account in accountStore.getAccountsByType(type)"
            :value="account.id"
            :key="account.id"
          >
            {{ account.name }}
          </option>
        </optgroup>
      </select>
      <select v-model="line.type" required>
        <option value="debit">Débito</option>
        <option value="credit">Crédito</option>
      </select>
      <input
        type="number"
        v-model.number="line.amount"
        placeholder="Valor"
        step="0.01"
        min="0"
        required
      />
      <button type="button" @click="removeLine(index)" class="remove-line-btn">Remover</button>
    </div>
    <button type="button" @click="addLine" class="add-line-btn">Adicionar Linha</button>

    <div class="balance-info">
      <p :class="{ positive: isBalanced, negative: !isBalanced }">
        Total Débitos: R$ {{ totalDebits.toFixed(2) }}
      </p>
      <p :class="{ positive: isBalanced, negative: !isBalanced }">
        Total Créditos: R$ {{ totalCredits.toFixed(2) }}
      </p>
    </div>

    <button type="submit" :disabled="!isBalanced">Registrar Lançamento</button>
  </form>
</template>

<style scoped>
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

.form-group input[type='date'],
.form-group input[type='text'] {
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
.entry-line input[type='number'] {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  flex: 1;
}

.remove-line-btn {
  padding: 8px 12px;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.remove-line-btn:hover {
  background-color: #c82333;
}

.add-line-btn {
  padding: 8px 12px;
  background-color: #17a2b8;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 5px;
}

.balance-info {
  margin-top: 20px;
  padding: 10px;
  border-top: 1px solid #eee;
}

.balance-info p {
  margin: 5px 0;
  font-weight: bold;
}

.positive {
  color: green;
}
.negative {
  color: red;
}

button[type='submit'] {
  margin-top: 10px;
  padding: 10px 20px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}
button[type='submit']:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}
</style>
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAccountStore } from '@/stores/accountStore'
import { useProductStore } from '@/stores/productStore'
import { useJournalEntryStore } from '@/stores/journalEntryStore' // Importar o store
import type { EntryLine } from '@/types'

const emit = defineEmits(['submit'])

const accountStore = useAccountStore()
const productStore = useProductStore()
const journalEntryStore = useJournalEntryStore() // Instanciar o store

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
  <form @submit.prevent="handleSubmit" class="bg-surface-50 p-6 rounded-lg shadow-md mb-6">
    <h2 class="text-2xl font-semibold text-surface-700 mb-4">Adicionar Novo Lançamento</h2>
    <div class="space-y-4">
      <div class="flex flex-col">
        <label for="entry-date" class="block text-sm font-medium text-surface-700">Data:</label>
        <input
          type="date"
          id="entry-date"
          v-model="newEntryDate"
          required
          class="mt-1 block w-full rounded-md border-surface-300 shadow-sm focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50 p-2"
        />
      </div>
      <div class="flex flex-col">
        <label for="entry-description" class="block text-sm font-medium text-surface-700"
          >Descrição:</label
        >
        <input
          type="text"
          id="entry-description"
          v-model="newEntryDescription"
          placeholder="Descrição do lançamento"
          required
          class="mt-1 block w-full rounded-md border-surface-300 shadow-sm focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50 p-2"
        />
      </div>

      <h3 class="text-xl font-semibold text-surface-700 border-b border-surface-300 pb-2">
        Linhas do Lançamento:
      </h3>
      <div
        v-for="(line, index) in newEntryLines"
        :key="index"
        class="flex flex-wrap items-center gap-4 mb-4"
      >
        <select
          v-model="line.account_id"
          required
          class="flex-1 min-w-[150px] p-2 border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
        >
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
        <select
          v-model="line.type"
          required
          class="flex-1 min-w-[100px] p-2 border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
        >
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
          class="flex-1 min-w-[100px] p-2 border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
        <button
          type="button"
          @click="removeLine(index)"
          class="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50"
        >
          Remover
        </button>
      </div>
      <button
        type="button"
        @click="addLine"
        class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 mt-2"
      >
        Adicionar Linha
      </button>

      <div class="mt-6 p-4 border-t border-surface-300 flex justify-around items-center">
        <p
          class="font-bold"
          :class="{ 'text-emerald-600': isBalanced, 'text-red-600': !isBalanced }"
        >
          Total Débitos: R$ {{ totalDebits.toFixed(2) }}
        </p>
        <p
          class="font-bold"
          :class="{ 'text-emerald-600': isBalanced, 'text-red-600': !isBalanced }"
        >
          Total Créditos: R$ {{ totalCredits.toFixed(2) }}
        </p>
      </div>

      <button
        type="submit"
        :disabled="!isBalanced || journalEntryStore.loading"
        class="w-full p-3 bg-emerald-400 text-white rounded-md hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-50 mt-4"
      >
        <span v-if="journalEntryStore.loading">Registrando...</span>
        <span v-else>Registrar Lançamento</span>
      </button>
    </div>
  </form>
</template>

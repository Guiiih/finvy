<script setup lang="ts">
import { computed, watch } from 'vue'
import { useAccountStore } from '@/stores/accountStore'
import type { EntryLine, Product } from '@/types/index'

const accountStore = useAccountStore()

const props = defineProps<{
  entryLines: EntryLine[],
  selectedProduct: Product | null
}>()

const emit = defineEmits(['update:entryLines'])

const internalEntryLines = computed<EntryLine[]>({ // Use computed with getter/setter
  get: () => props.entryLines,
  set: (newValue) => emit('update:entryLines', newValue),
})

const visibleAccounts = computed(() => {
  return accountStore.accounts.filter((account) => !account.is_protected)
})

const stockAccountId = computed(() => {
  return accountStore.accounts.find(acc => acc.name === 'Estoques')?.id
})

watch(() => props.selectedProduct, (newProduct) => {
  if (newProduct) {
    const lastLine = internalEntryLines.value[internalEntryLines.value.length - 1]
    if (lastLine) {
      lastLine.product_id = newProduct.id
    }
  }
})

function addLine() {
  internalEntryLines.value.push({ account_id: '', type: 'debit', amount: 0 })
}

function removeLine(index: number) {
  internalEntryLines.value.splice(index, 1)
}

const totalDebits = computed(() =>
  internalEntryLines.value.reduce(
    (sum: number, line: EntryLine) => (line.type === 'debit' ? sum + (line.amount || 0) : sum),
    0,
  ),
)

const totalCredits = computed(() =>
  internalEntryLines.value.reduce(
    (sum: number, line: EntryLine) => (line.type === 'credit' ? sum + (line.amount || 0) : sum),
    0,
  ),
)

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
</script>

<template>
  <div class="space-y-4">
    <h3 class="text-xl font-semibold text-surface-700 border-b border-surface-300 pb-2">
      Linhas do Lançamento
    </h3>
    <div
      v-for="(line, index) in internalEntryLines"
      :key="index"
      class="grid grid-cols-1 md:grid-cols-12 gap-4 items-center"
    >
      <select
        v-model="line.account_id"
        required
        :class="line.account_id === stockAccountId ? 'md:col-span-4' : 'md:col-span-5'" 
        class="p-3 border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
      >
        <option value="" disabled>Selecione a Conta</option>
        <optgroup v-for="type in accountStore.accountTypes" :label="type" :key="type">
          <option
            v-for="account in visibleAccounts.filter((acc) => acc.type === type)"
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
            :class="line.account_id === stockAccountId ? 'md:col-span-2' : 'md:col-span-2'"
            class="p-3 border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400" 
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
            :class="line.account_id === stockAccountId ? 'md:col-span-2' : 'md:col-span-4'"
            class="p-3 border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400" 
          />
      <div class="md:col-span-1 flex items-center space-x-2">
        <button
          type="button"
          @click="removeLine(index)"
          class="flex justify-center items-center p-2 rounded-full hover:bg-red-100 text-red-600 transition"
          title="Remover Linha"
        >
          <i class="pi pi-trash w-5 h-5"></i>
        </button>
        <button
          type="button"
          @click="addLine"
          class="flex justify-center items-center p-2 rounded-full hover:bg-green-100 text-green-600 transition"
          title="Adicionar Linha"
        >
          <i class="pi pi-plus w-5 h-5"></i>
        </button>
      </div>
    </div>

    <div
      class="p-4 rounded-lg flex flex-col sm:flex-row justify-around items-center space-y-2 sm:space-y-0"
    >
      <p class="text-lg">
        Total Débitos:
        <span class="font-bold text-green-400">{{ formatCurrency(totalDebits) }}</span>
      </p>
      <p class="text-lg">
        Total Créditos:
        <span class="font-bold text-red-400">{{ formatCurrency(totalCredits) }}</span>
      </p>
      <p
        class="text-lg"
        :class="{
          'text-green-400': totalDebits === totalCredits,
          'text-yellow-400': totalDebits !== totalCredits,
        }"
      >
        Diferença:
        <span class="font-bold">{{ formatCurrency(totalDebits - totalCredits) }}</span>
      </p>
    </div>
  </div>
</template>

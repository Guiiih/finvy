<script setup lang="ts">
import { computed, watch } from 'vue'
import { useAccountStore } from '@/stores/accountStore'
import type { EntryLine, Product } from '@/types/index'
import Button from 'primevue/button'
import Select from 'primevue/select'
import InputNumber from 'primevue/inputnumber'

interface SelectedProductData {
  product: Product
  quantity?: number
  unitCost?: number
}

const accountStore = useAccountStore()

const props = defineProps<{
  entryLines: EntryLine[]
  selectedProduct: SelectedProductData | null
}>()

const emit = defineEmits(['update:entryLines'])

const internalEntryLines = computed<EntryLine[]>({
  // Use computed with getter/setter
  get: () => props.entryLines,
  set: (newValue) => emit('update:entryLines', newValue),
})

const visibleAccounts = computed(() => {
  return accountStore.accounts.filter((account) => !account.is_protected)
})

const stockAccountId = computed(() => {
  return accountStore.accounts.find((acc) => acc.name === 'Estoques')?.id
})

watch(
  () => props.selectedProduct,
  (newProductData) => {
    if (newProductData && newProductData.product) {
      const product = newProductData.product
      const quantity = newProductData.quantity
      const unitCost = newProductData.unitCost

      const lastLine = internalEntryLines.value[internalEntryLines.value.length - 1]
      if (lastLine) {
        lastLine.product_id = product.id
        lastLine.quantity = quantity
        lastLine.unit_cost = unitCost
      }
    }
  },
)

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
    <div class="flex justify-between items-center border-b border-surface-300 pb-2">
      <h3 class="text-xl font-semibold text-surface-700">Partidas Contábeis</h3>
      <Button
        label="Adicionar Linha"
        icon="pi pi-plus"
        severity="secondary"
        outlined
        @click="addLine"
        class="p-button-sm"
      />
    </div>
    <div
      v-for="(line, index) in internalEntryLines"
      :key="index"
      class="grid grid-cols-1 md:grid-cols-12 gap-4 items-center"
    >
      <Select
        v-model="line.account_id"
        required
        :class="
          internalEntryLines.length > 2
            ? line.account_id === stockAccountId
              ? 'md:col-span-4'
              : 'md:col-span-5'
            : line.account_id === stockAccountId
              ? 'md:col-span-5'
              : 'md:col-span-6'
        "
        :options="visibleAccounts"
        optionLabel="name"
        optionValue="id"
        placeholder="Selecione a Conta"
        class="w-full"
        size="small"
      />
      <Select
        v-model="line.type"
        required
        :class="
          internalEntryLines.length > 2
            ? line.account_id === stockAccountId
              ? 'md:col-span-2'
              : 'md:col-span-2'
            : line.account_id === stockAccountId
              ? 'md:col-span-2'
              : 'md:col-span-2'
        "
        :options="[
          { label: 'Débito', value: 'debit' },
          { label: 'Crédito', value: 'credit' },
        ]"
        optionLabel="label"
        optionValue="value"
        class="w-full"
        size="small"
      />
      <InputNumber
        v-model="line.amount"
        placeholder="Valor"
        mode="decimal"
        :min="0"
        :maxFractionDigits="2"
        required
        :class="
          internalEntryLines.length > 2
            ? line.account_id === stockAccountId
              ? 'md:col-span-2'
              : 'md:col-span-4'
            : line.account_id === stockAccountId
              ? 'md:col-span-5'
              : 'md:col-span-4'
        "
        class="w-full"
        size="small"
      />
      <div class="md:col-span-1 flex items-center space-x-2">
        <button
          type="button"
          @click="removeLine(index)"
          class="flex justify-center items-center p-2 rounded-full hover:bg-red-100 text-red-600 transition"
          title="Remover Linha"
          v-if="internalEntryLines.length > 2"
        >
          <i class="pi pi-trash w-5 h-5"></i>
        </button>
      </div>
    </div>

    <div
      class="p-4 rounded-lg flex flex-col sm:flex-row justify-around items-center space-y-2 sm:space-y-0"
    >
      <p class="text-base">
        Total Débitos:
        <span class="font-bold text-green-400">{{ formatCurrency(totalDebits) }}</span>
      </p>
      <p class="text-base">
        Total Créditos:
        <span class="font-bold text-red-400">{{ formatCurrency(totalCredits) }}</span>
      </p>
      <p class="text-base">
        Diferença:
        <span
          class="font-bold"
          :class="{
            'text-green-400': totalDebits === totalCredits,
            'text-yellow-400': totalDebits !== totalCredits,
          }"
          >{{ formatCurrency(totalDebits - totalCredits) }}</span
        >
      </p>
    </div>
  </div>
</template>

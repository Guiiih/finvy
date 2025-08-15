<script setup lang="ts">
import { ref, watch } from 'vue'
import Dropdown from 'primevue/dropdown'

const props = defineProps<{
  entryDate: string
  entryDescription: string
  referencePrefix: string
  status: string
  hasStockRelatedAccount: boolean
}>()

const emit = defineEmits([
  'update:entryDate',
  'update:entryDescription',
  'update:referencePrefix',
  'update:status',
])

const internalEntryDate = ref(props.entryDate)
const internalEntryDescription = ref(props.entryDescription)
const internalReferencePrefix = ref(props.referencePrefix)
const internalStatus = ref(props.status)

const statusOptions = ref([
  { label: 'Rascunho', value: 'draft' },
  { label: 'Lançado', value: 'posted' },
  { label: 'Revisado', value: 'reviewed' },
])

watch(
  () => props.entryDate,
  (newValue) => {
    internalEntryDate.value = newValue
  },
)

watch(
  () => props.entryDescription,
  (newValue) => {
    internalEntryDescription.value = newValue
  },
)

watch(
  () => props.referencePrefix,
  (newValue) => {
    internalReferencePrefix.value = newValue
  },
)

watch(
  () => props.status,
  (newValue) => {
    internalStatus.value = newValue
  },
)

watch(internalEntryDate, (newValue) => {
  emit('update:entryDate', newValue)
})

watch(internalEntryDescription, (newValue) => {
  emit('update:entryDescription', newValue)
})

watch(internalReferencePrefix, (newValue) => {
  emit('update:referencePrefix', newValue)
})

watch(internalStatus, (newValue) => {
  emit('update:status', newValue)
})
</script>

<template>
  <div class="space-y-4">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="space-y-2">
        <label for="entry-date" class="text-sm font-medium">Data *</label>
        <input
          type="date"
          id="entry-date"
          v-model="internalEntryDate"
          required
          class="p-2 w-full bg-surface-50 border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div class="space-y-2">
        <label for="entry-reference-prefix" class="text-sm font-medium">Referência *</label>
        <input
          type="text"
          id="entry-reference-prefix"
          v-model="internalReferencePrefix"
          placeholder="Ex: NF001, DOC002"
          required
          class="p-2 w-full bg-surface-50 border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
    </div>

    <div class="space-y-2">
      <label for="entry-description" class="text-sm font-medium">Descrição *</label>
      <textarea
        id="entry-description"
        v-model="internalEntryDescription"
        placeholder="Descreva a natureza da transação..."
        required
        rows="3"
        class="p-2 w-full bg-surface-50 border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
      ></textarea>
    </div>

    <div class="space-y-2">
      <label for="entry-status" class="text-sm font-medium">Status</label>
      <Dropdown
        id="entry-status"
        v-model="internalStatus"
        :options="statusOptions"
        optionLabel="label"
        optionValue="value"
        placeholder="Selecione o Status"
        class="w-full"
        required
      />
    </div>

    <div v-if="hasStockRelatedAccount" class="p-4 bg-blue-50 rounded-lg">
      <div class="flex items-center gap-2 mb-2">
        <i class="pi pi-box h-4 w-4 text-blue-600"></i>
        <span class="font-medium text-blue-900">Conta de Estoque Detectada</span>
      </div>
      <p class="text-sm text-blue-800">
        Este lançamento afeta o estoque. Configure o produto na aba "Produto" que apareceu
        automaticamente.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import Dropdown from 'primevue/dropdown'

const props = defineProps<{
  entryDate: string
  entryDescription: string
  referencePrefix: string
  status: string
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
    <div class="flex flex-col">
      <label for="entry-date" class="text-surface-700 font-medium mb-1">Data:</label>
      <input
        type="date"
        id="entry-date"
        v-model="internalEntryDate"
        required
        class="p-3 border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
      />
    </div>
    <div class="flex flex-col">
      <label for="entry-description" class="text-surface-700 font-medium mb-1">Descrição:</label>
      <input
        type="text"
        id="entry-description"
        v-model="internalEntryDescription"
        placeholder="Descrição do lançamento"
        required
        class="p-3 border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
      />
    </div>
    <div class="flex flex-col">
      <label for="entry-reference-prefix" class="text-surface-700 font-medium mb-1"
        >Prefixo da Referência:</label
      >
      <input
        type="text"
        id="entry-reference-prefix"
        v-model="internalReferencePrefix"
        placeholder="Ex: NF, DOC"
        required
        class="p-3 border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
      />
    </div>
    <div class="flex flex-col">
      <label for="entry-status" class="text-surface-700 font-medium mb-1">Status:</label>
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
  </div>
</template>

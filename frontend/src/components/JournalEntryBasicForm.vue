<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  entryDate: string
  entryDescription: string
  referencePrefix: string
}>()

const emit = defineEmits(['update:entryDate', 'update:entryDescription', 'update:referencePrefix'])

const internalEntryDate = ref(props.entryDate)
const internalEntryDescription = ref(props.entryDescription)
const internalReferencePrefix = ref(props.referencePrefix)

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

watch(internalEntryDate, (newValue) => {
  emit('update:entryDate', newValue)
})

watch(internalEntryDescription, (newValue) => {
  emit('update:entryDescription', newValue)
})

watch(internalReferencePrefix, (newValue) => {
  emit('update:referencePrefix', newValue)
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
  </div>
</template>

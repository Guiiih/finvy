<script setup lang="ts">
import { ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Calendar from 'primevue/calendar'
import Checkbox from 'primevue/checkbox'
import MultiSelect from 'primevue/multiselect'
import type { Account } from '@/types'

const props = defineProps<{
  visible: boolean
  accounts: Account[]
}>()

const emit = defineEmits(['update:visible', 'apply-filters'])

const filters = ref({
  dateFrom: null,
  dateTo: null,
  amountFrom: null,
  amountTo: null,
  createdBy: '',
  hasProduct: false,
  hasTaxes: false,
  selectedAccounts: [],
})

watch(
  () => props.visible,
  (newVal) => {
    if (!newVal) {
      // Reset filters when modal is closed without applying
    }
  },
)

function applyFilters() {
  emit('apply-filters', filters.value)
  emit('update:visible', false)
}

function clearFilters() {
  filters.value = {
    dateFrom: null,
    dateTo: null,
    amountFrom: null,
    amountTo: null,
    createdBy: '',
    hasProduct: false,
    hasTaxes: false,
    selectedAccounts: [],
  }
  emit('apply-filters', filters.value) // Also apply cleared filters
}
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    modal
    header="Filtros Avançados"
    class="w-full max-w-2xl"
  >
    <div class="space-y-6 p-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="flex flex-col">
          <label for="dateFrom" class="mb-2 font-semibold">Data Inicial</label>
          <Calendar v-model="filters.dateFrom" dateFormat="dd/mm/yy" inputId="dateFrom" />
        </div>
        <div class="flex flex-col">
          <label for="dateTo" class="mb-2 font-semibold">Data Final</label>
          <Calendar v-model="filters.dateTo" dateFormat="dd/mm/yy" inputId="dateTo" />
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="flex flex-col">
          <label for="amountFrom" class="mb-2 font-semibold">Valor Mínimo (R$)</label>
          <InputText
            v-model="filters.amountFrom"
            type="number"
            placeholder="0,00"
            inputId="amountFrom"
          />
        </div>
        <div class="flex flex-col">
          <label for="amountTo" class="mb-2 font-semibold">Valor Máximo (R$)</label>
          <InputText
            v-model="filters.amountTo"
            type="number"
            placeholder="0,00"
            inputId="amountTo"
          />
        </div>
      </div>

      <div class="flex flex-col">
        <label for="createdBy" class="mb-2 font-semibold">Criado por</label>
        <InputText v-model="filters.createdBy" placeholder="Nome do usuário" inputId="createdBy" />
      </div>

      <div class="space-y-3">
        <h3 class="font-semibold">Opções Adicionais</h3>
        <div class="flex items-center">
          <Checkbox v-model="filters.hasProduct" inputId="hasProduct" :binary="true" />
          <label for="hasProduct" class="ml-2">Apenas com movimentação de produto</label>
        </div>
        <div class="flex items-center">
          <Checkbox v-model="filters.hasTaxes" inputId="hasTaxes" :binary="true" />
          <label for="hasTaxes" class="ml-2">Apenas com impostos calculados</label>
        </div>
      </div>

      <div class="flex flex-col">
        <label for="accounts" class="mb-2 font-semibold">Contas Contábeis</label>
        <MultiSelect
          v-model="filters.selectedAccounts"
          :options="accounts"
          optionLabel="name"
          optionValue="id"
          placeholder="Selecione contas específicas"
          class="w-full"
        />
        <small class="text-gray-500 mt-1">Deixe vazio para incluir todas as contas.</small>
      </div>
    </div>

    <template #footer>
      <Button
        label="Limpar Filtros"
        icon="pi pi-filter-slash"
        class="p-button-text"
        @click="clearFilters"
      />
      <Button label="Cancelar" icon="pi pi-times" @click="$emit('update:visible', false)" />
      <Button label="Aplicar Filtros" icon="pi pi-check" @click="applyFilters" />
    </template>
  </Dialog>
</template>

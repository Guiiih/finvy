<script setup lang="ts">
import { ref, watch, defineEmits, defineProps } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputNumber from 'primevue/inputnumber'
import DatePicker from 'primevue/datepicker'
import Checkbox from 'primevue/checkbox'
import MultiSelect from 'primevue/multiselect'
import type { Account } from '@/types' // Importar o tipo Account

const props = defineProps<{
  visible: boolean
  accounts: Account[] // Alterado para receber accounts diretamente
  initialFilters: {
    dateFrom: string | null
    dateTo: string | null
    amountFrom: number | null
    amountTo: number | null
    createdBy: string | null
    hasProduct: boolean
    hasTaxes: boolean
    accounts: string[]
  }
}>()

const emit = defineEmits(['update:visible', 'apply-filters']) // Alterado o nome do evento

const filters = ref({
  dateFrom: null as Date | null,
  dateTo: null as Date | null,
  amountFrom: null as number | null,
  amountTo: null as number | null,
  createdBy: '' as string,
  hasProduct: false,
  hasTaxes: false,
  selectedAccounts: [] as string[],
})

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      filters.value.dateFrom = props.initialFilters.dateFrom
        ? new Date(props.initialFilters.dateFrom)
        : null
      filters.value.dateTo = props.initialFilters.dateTo
        ? new Date(props.initialFilters.dateTo)
        : null
      filters.value.amountFrom = props.initialFilters.amountFrom
      filters.value.amountTo = props.initialFilters.amountTo
      filters.value.createdBy = props.initialFilters.createdBy || ''
      filters.value.hasProduct = props.initialFilters.hasProduct
      filters.value.hasTaxes = props.initialFilters.hasTaxes
      filters.value.selectedAccounts = props.initialFilters.accounts
    }
  },
)

function applyFilters() {
  emit('apply-filters', {
    dateFrom: filters.value.dateFrom ? filters.value.dateFrom.toISOString().split('T')[0] : null,
    dateTo: filters.value.dateTo ? filters.value.dateTo.toISOString().split('T')[0] : null,
    amountFrom: filters.value.amountFrom,
    amountTo: filters.value.amountTo,
    createdBy: filters.value.createdBy,
    hasProduct: filters.value.hasProduct,
    hasTaxes: filters.value.hasTaxes,
    accounts: filters.value.selectedAccounts,
  })
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
  emit('apply-filters', filters.value) // Aplica os filtros limpos
  emit('update:visible', false)
}
</script>

<template>
  <Dialog
    :visible="visible"
    :style="{ width: '550px' }"
    @update:visible="$emit('update:visible', $event)"
    modal
    class="w-full max-w-2xl"
  >
    <template #header>
      <div>
        <h2 class="text-base font-bold">Filtros Avançados</h2>
        <p class="text-sm text-surface-500">
          Configure filtros detalhados para os lançamentos contábeis
        </p>
      </div>
    </template>
    <div class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="flex flex-col">
          <label for="dateFrom" class="text-sm mb-1">Data Inicial</label>
          <DatePicker
            v-model="filters.dateFrom"
            dateFormat="dd/mm/yy"
            inputId="dateFrom"
            size="small"
            showIcon
            iconDisplay="input"
          />
        </div>
        <div class="flex flex-col">
          <label for="dateTo" class="text-sm mb-1">Data Final</label>
          <DatePicker
            v-model="filters.dateTo"
            dateFormat="dd/mm/yy"
            inputId="dateTo"
            size="small"
            showIcon
            iconDisplay="input"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="flex flex-col">
          <label for="amountFrom" class="text-sm mb-1">Valor Mínimo (R$)</label>
          <InputNumber
            v-model="filters.amountFrom"
            placeholder="0,00"
            inputId="amountFrom"
            size="small"
            mode="decimal"
            :minFractionDigits="2"
            :maxFractionDigits="2"
            showButtons
            :min="0"
          />
        </div>
        <div class="flex flex-col">
          <label for="amountTo" class="text-sm mb-1">Valor Máximo (R$)</label>
          <InputNumber
            v-model="filters.amountTo"
            placeholder="0,00"
            inputId="amountTo"
            size="small"
            mode="decimal"
            :minFractionDigits="2"
            :maxFractionDigits="2"
            showButtons
            :min="0"
          />
        </div>
      </div>

      <div class="flex flex-col">
        <label for="createdBy" class="text-sm mb-1">Criado por</label>
        <InputText
          v-model="filters.createdBy"
          placeholder="Nome do usuário"
          inputId="createdBy"
          size="small"
        />
      </div>

      <div class="space-y-3">
        <h3 class="text-sm">Opções Adicionais</h3>
        <div class="flex items-center">
          <Checkbox v-model="filters.hasProduct" inputId="hasProduct" :binary="true" size="small" />
          <label for="hasProduct" class="text-sm ml-2">Apenas com movimentação de produto</label>
        </div>
        <div class="flex items-center">
          <Checkbox v-model="filters.hasTaxes" inputId="hasTaxes" :binary="true" size="small" />
          <label for="hasTaxes" class="text-sm ml-2">Apenas com impostos calculados</label>
        </div>
      </div>

      <div class="flex flex-col">
        <label for="accounts" class="text-sm mb-1">Contas Contábeis</label>
        <MultiSelect
          v-model="filters.selectedAccounts"
          :options="accounts"
          optionLabel="name"
          optionValue="id"
          placeholder="Selecione contas específicas"
          class="w-full"
          size="small"
        />
        <small class="text-gray-500 mt-1">Deixe vazio para incluir todas as contas.</small>
      </div>
    </div>

    <template #footer>
      <Button label="Limpar Filtros" @click="clearFilters" size="small" variant="outlined" />
      <Button
        label="Cancelar"
        @click="$emit('update:visible', false)"
        size="small"
        variant="outlined"
      />
      <Button label="Aplicar Filtros" @click="applyFilters" size="small" />
    </template>
  </Dialog>
</template>

<style scoped>
/* Adicione estilos específicos do componente aqui, se necessário */
</style>

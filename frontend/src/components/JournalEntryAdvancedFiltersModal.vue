<script setup lang="ts">
import { ref, watch, defineEmits, defineProps } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Calendar from 'primevue/calendar';
import Checkbox from 'primevue/checkbox';
import MultiSelect from 'primevue/multiselect';
import type { Account } from '@/types'; // Importar o tipo Account

const props = defineProps<{
  visible: boolean;
  accounts: Account[]; // Alterado para receber accounts diretamente
  initialFilters: {
    dateFrom: string | null;
    dateTo: string | null;
    amountFrom: number | null;
    amountTo: number | null;
    createdBy: string | null;
    hasProduct: boolean;
    hasTaxes: boolean;
    accounts: string[];
  };
}>();

const emit = defineEmits(['update:visible', 'apply-filters']); // Alterado o nome do evento

const filters = ref({
  dateFrom: null as Date | null,
  dateTo: null as Date | null,
  amountFrom: null as string | null,
  amountTo: null as string | null,
  createdBy: '' as string,
  hasProduct: false,
  hasTaxes: false,
  selectedAccounts: [] as string[],
});

watch(() => props.visible, (newVal) => {
  if (newVal) {
    filters.value.dateFrom = props.initialFilters.dateFrom ? new Date(props.initialFilters.dateFrom) : null;
    filters.value.dateTo = props.initialFilters.dateTo ? new Date(props.initialFilters.dateTo) : null;
    filters.value.amountFrom = props.initialFilters.amountFrom !== null ? String(props.initialFilters.amountFrom) : null;
    filters.value.amountTo = props.initialFilters.amountTo !== null ? String(props.initialFilters.amountTo) : null;
    filters.value.createdBy = props.initialFilters.createdBy || '';
    filters.value.hasProduct = props.initialFilters.hasProduct;
    filters.value.hasTaxes = props.initialFilters.hasTaxes;
    filters.value.selectedAccounts = props.initialFilters.accounts;
  }
});

function applyFilters() {
  emit('apply-filters', {
    dateFrom: filters.value.dateFrom ? filters.value.dateFrom.toISOString().split('T')[0] : null,
    dateTo: filters.value.dateTo ? filters.value.dateTo.toISOString().split('T')[0] : null,
    amountFrom: filters.value.amountFrom !== null ? parseFloat(filters.value.amountFrom) : null,
    amountTo: filters.value.amountTo !== null ? parseFloat(filters.value.amountTo) : null,
    createdBy: filters.value.createdBy,
    hasProduct: filters.value.hasProduct,
    hasTaxes: filters.value.hasTaxes,
    accounts: filters.value.selectedAccounts,
  });
  emit('update:visible', false);
};

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
  };
  emit('apply-filters', filters.value); // Aplica os filtros limpos
  emit('update:visible', false);
};
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
          <InputText v-model="filters.amountFrom" placeholder="0,00" inputId="amountFrom" />
        </div>
        <div class="flex flex-col">
          <label for="amountTo" class="mb-2 font-semibold">Valor Máximo (R$)</label>
          <InputText v-model="filters.amountTo" placeholder="0,00" inputId="amountTo" />
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
      <Button label="Limpar Filtros" icon="pi pi-filter-slash" class="p-button-text" @click="clearFilters" />
      <Button label="Cancelar" icon="pi pi-times" class="p-button-outlined" @click="$emit('update:visible', false)" />
      <Button label="Aplicar Filtros" icon="pi pi-check" @click="applyFilters" />
    </template>
  </Dialog>
</template>

<style scoped>
/* Adicione estilos específicos do componente aqui, se necessário */
</style>

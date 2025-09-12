<script setup lang="ts">
import { ref } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'
import Checkbox from 'primevue/checkbox'

// --- PROPS & EMITS ---
const props = defineProps<{
  selectedProductsCount: number
  filteredProductsCount: number
  totalProducts: number
  activeProducts: number
  lowStockProducts: number
  totalInventoryValue: number
  formatCurrency: (value: number) => string
  categoriesCount: number
}>()

const emit = defineEmits(['export'])
const visible = defineModel<boolean>('visible')

// --- STATE ---
const exportFormat = ref('excel')
const exportScope = ref('filtered')

// --- METHODS ---
const handleExport = () => {
  emit('export', { format: exportFormat.value, scope: exportScope.value })
}
</script>

<template>
  <Dialog v-model:visible="visible" :modal="true" class="w-full max-w-lg">
    <template #header>
      <div class="flex flex-col">
        <div class="flex items-center gap-3">
          <i class="pi pi-download text-xl"></i>
          <span class="text-xl font-bold">Exportar Produtos</span>
        </div>
        <span class="text-sm text-surface-500 mt-1"
          >Configure as opções de exportação do catálogo</span
        >
      </div>
    </template>
    <div class="space-y-6 p-4">
      <div class="space-y-2">
        <label class="block text-sm font-medium text-surface-700 mb-1">Formato de Exportação</label>
        <Select
          :options="[
            { label: 'Excel (.xlsx)', value: 'excel' },
            { label: 'CSV', value: 'csv' },
            { label: 'PDF (Relatório)', value: 'pdf' },
          ]"
          optionLabel="label"
          optionValue="value"
          v-model="exportFormat"
          placeholder="Selecione"
          class="w-full"
        />
      </div>

      <div class="space-y-2">
        <label class="block text-sm font-medium text-surface-700 mb-1">Produtos a Exportar</label>
        <Select
          :options="[
            {
              label: `Produtos selecionados (${props.selectedProductsCount})`,
              value: 'selected',
              disabled: props.selectedProductsCount === 0,
            },
            { label: `Produtos filtrados (${props.filteredProductsCount})`, value: 'filtered' },
            { label: `Todos os produtos (${props.totalProducts})`, value: 'all' },
            { label: `Apenas produtos ativos (${props.activeProducts})`, value: 'active' },
            { label: `Produtos com estoque baixo (${props.lowStockProducts})`, value: 'lowstock' },
          ]"
          optionLabel="label"
          optionValue="value"
          v-model="exportScope"
          placeholder="Selecione"
          class="w-full"
        />
      </div>

      <div class="space-y-2">
        <label class="block text-sm font-medium text-surface-700 mb-2">Incluir nas Colunas</label>
        <div class="grid grid-cols-2 gap-4">
          <div class="flex items-center space-x-2">
            <Checkbox inputId="includeBasicInfo" :binary="true" :modelValue="true" />
            <label for="includeBasicInfo" class="text-sm">Informações básicas</label>
          </div>
          <div class="flex items-center space-x-2">
            <Checkbox inputId="includePricing" :binary="true" :modelValue="true" />
            <label for="includePricing" class="text-sm">Preços e custos</label>
          </div>
          <div class="flex items-center space-x-2">
            <Checkbox inputId="includeStock" :binary="true" :modelValue="true" />
            <label for="includeStock" class="text-sm">Dados de estoque</label>
          </div>
          <div class="flex items-center space-x-2">
            <Checkbox inputId="includeSales" :binary="true" :modelValue="true" />
            <label for="includeSales" class="text-sm">Histórico de vendas</label>
          </div>
          <div class="flex items-center space-x-2">
            <Checkbox inputId="includeMovements" :binary="true" :modelValue="false" />
            <label for="includeMovements" class="text-sm">Movimentações</label>
          </div>
          <div class="flex items-center space-x-2">
            <Checkbox inputId="includeMetrics" :binary="true" :modelValue="false" />
            <label for="includeMetrics" class="text-sm">Métricas calculadas</label>
          </div>
        </div>
      </div>

      <div class="bg-green-50 p-4 rounded-lg">
        <div class="flex items-center gap-2 mb-2">
          <i class="pi pi-chart-line text-green-600"></i>
          <span class="font-medium text-green-900">Resumo da Exportação</span>
        </div>
        <div class="text-sm text-green-800 space-y-1">
          <p>• {{ props.filteredProductsCount }} produtos serão exportados</p>
          <p>• Valor total do estoque: {{ props.formatCurrency(props.totalInventoryValue) }}</p>
          <p>• {{ props.activeProducts }} produtos ativos</p>
          <p>
            •
            {{ props.categoriesCount }}
            categorias diferentes
          </p>
        </div>
      </div>
    </div>

    <template #footer>
      <Button label="Cancelar" severity="secondary" text @click="visible = false" />
      <Button label="Exportar" icon="pi pi-download" @click="handleExport" />
    </template>
  </Dialog>
</template>

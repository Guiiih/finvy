<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { Product, CostingMethod } from '@/types'

// Import PrimeVue components
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'

// --- PROPS & EMITS ---
const props = defineProps<{
  isEditing: boolean
  initialData: Product | null
  loading: boolean
  categories: string[]
  unitTypes: string[]
  costingMethods: { value: CostingMethod; label: string }[]
  statusOptions: { label: string; value: boolean }[]
}>()

const emit = defineEmits(['submit', 'click:import'])
const visible = defineModel<boolean>('visible')

// --- STATE ---
const productForm = ref<Product>({} as Product)

// --- WATCHERS ---
watch(visible, (newValue) => {
  if (newValue && props.initialData) {
    productForm.value = { ...props.initialData }
  }
})

// --- COMPUTED ---
const profitMargin = computed(() => {
  if (productForm.value.unit_price && productForm.value.unit_price > 0) {
    const cost = productForm.value.avg_cost || 0
    return ((productForm.value.unit_price - cost) / productForm.value.unit_price) * 100
  }
  return 0
})

// --- METHODS ---
const handleFormSubmit = () => {
  emit('submit', productForm.value)
}

const closeModal = () => {
  visible.value = false
}
</script>

<template>
  <Dialog v-model:visible="visible" :modal="true" class="w-full max-w-3xl" @hide="closeModal">
    <template #header>
      <div class="flex flex-col gap-1">
        <h2 class="text-lg font-bold">{{ isEditing ? 'Editar Produto' : 'Novo Produto' }}</h2>
        <p v-if="!isEditing" class="text-sm text-surface-500">
          Cadastre um novo produto com todas as informações básicas.
        </p>
        <p v-else class="text-sm text-surface-500">Modifique as informações do produto.</p>
      </div>
    </template>
    <div class="space-y-6">
      <div class="space-y-4">
        <h4 class="font-medium">Informações Básicas</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <label class="text-sm">Nome do Produto *</label>
            <InputText
              v-model="productForm.name"
              placeholder="Ex: Notebook Dell Inspiron 15"
              size="small"
            />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-sm">SKU (opcional)</label>
            <InputText
              v-model="productForm.sku"
              placeholder="Será gerado automaticamente se vazio"
              size="small"
            />
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="flex flex-col gap-2">
            <label class="text-sm">Categoria *</label>
            <Select
              size="small"
              v-model="productForm.category"
              :options="props.categories"
              placeholder="Selecione uma categoria"
            />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-sm">Marca *</label>
            <InputText
              v-model="productForm.brand"
              placeholder="Ex: Dell, HP, Logitech"
              size="small"
            />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-sm">Unidade</label>
            <Select
              v-model="productForm.unit_type"
              :options="props.unitTypes"
              placeholder="Unidade"
              size="small"
            />
          </div>
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-sm">Descrição</label>
          <Textarea
            v-model="productForm.description"
            rows="3"
            placeholder="Descrição detalhada..."
            class="resize-none"
            size="small"
          />
        </div>
      </div>

      <div class="space-y-4">
        <h4 class="font-medium">Preços e Custos</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <label class="text-sm">Custo Unitário</label>
            <InputNumber
              v-model="productForm.avg_cost"
              inputId="avg_cost"
              mode="currency"
              currency="BRL"
              locale="pt-BR"
              size="small"
            />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-sm">Preço de Venda</label>
            <InputNumber
              v-model="productForm.unit_price"
              inputId="unit_price"
              mode="currency"
              currency="BRL"
              locale="pt-BR"
              size="small"
            />
          </div>
        </div>
        <div
          v-if="productForm.unit_price && productForm.unit_price > 0"
          class="p-3 bg-surface-50 rounded-lg"
        >
          <span class="font-medium">Margem de Lucro: </span>
          <span :class="profitMargin > 0 ? 'text-green-600' : 'text-red-600'"
            >{{ profitMargin.toFixed(2) }}%</span
          >
        </div>
      </div>

      <div class="space-y-4">
        <h4 class="font-medium">Controle de Estoque</h4>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="flex flex-col gap-2">
            <label class="text-sm">Estoque Mínimo</label>
            <InputNumber v-model="productForm.min_stock" inputId="min_stock" size="small" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-sm">Estoque Máximo</label>
            <InputNumber v-model="productForm.max_stock" inputId="max_stock" size="small" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-sm">Método de Custeio</label>
            <Select
              v-model="productForm.costing_method"
              :options="props.costingMethods"
              optionLabel="label"
              optionValue="value"
              placeholder="Selecione"
              size="small"
            />
          </div>
        </div>
      </div>

      <div class="space-y-4">
        <h4 class="font-medium">Informações Adicionais</h4>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="flex flex-col gap-2">
            <label class="text-sm">Fornecedor</label>
            <InputText
              v-model="productForm.supplier"
              placeholder="Nome do fornecedor principal"
              size="small"
            />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-sm">Peso (kg)</label>
            <InputNumber v-model="productForm.weight" inputId="weight" size="small" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-sm">Dimensões</label>
            <InputText
              v-model="productForm.dimensions"
              placeholder="Ex: 30x20x15 cm"
              size="small"
            />
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="flex flex-col gap-2">
            <label class="text-sm">Localização no Estoque</label>
            <InputText v-model="productForm.location" placeholder="Ex: A1-B2-C3" size="small" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-sm">NCM</label>
            <InputText v-model="productForm.ncm" placeholder="Ex: 8471.30.19" size="small" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-sm">Status</label>
            <Select
              v-model="productForm.is_active"
              :options="props.statusOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Ativo"
              size="small"
            />
          </div>
        </div>
      </div>
    </div>
    <div class="flex justify-end gap-2 mt-6">
      <Button label="Cancelar" severity="secondary" @click="closeModal" size="small" />
      <Button
        label="Importar"
        icon="pi pi-upload"
        @click="emit('click:import')"
        severity="secondary"
        size="small"
      />
      <Button
        :label="isEditing ? 'Salvar Alterações' : 'Criar Produto'"
        @click="handleFormSubmit"
        :loading="props.loading"
        size="small"
      />
    </div>
  </Dialog>
</template>

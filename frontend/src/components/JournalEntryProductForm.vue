<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useProductStore } from '@/stores/productStore'

import Dropdown from 'primevue/dropdown'
import InputNumber from 'primevue/inputnumber'
import Card from 'primevue/card'

const productStore = useProductStore()

interface ProductData {
  productId: string | null
  quantity?: number
  unitCost?: number
}

const productData = ref<ProductData>({
  productId: null,
  quantity: undefined,
  unitCost: undefined,
})

const emit = defineEmits(['product-selected'])

onMounted(() => {
  productStore.fetchProducts(1, 1000) // Fetch all products
})

const selectedProductDetails = computed(() => {
  return productStore.products.find((p) => p.id === productData.value.productId)
})

watch(
  productData,
  (newValue) => {
    if (newValue.productId) {
      emit('product-selected', {
        product: selectedProductDetails.value,
        quantity: newValue.quantity,
        unitCost: newValue.unitCost,
      })
    } else {
      emit('product-selected', null)
    }
  },
  { deep: true },
)
</script>

<template>
  <div class="space-y-4">
    <div class="p-4 bg-blue-50 rounded-lg">
      <div class="flex items-center gap-2 mb-2">
        <i class="pi pi-info-circle h-4 w-4 text-blue-600"></i>
        <span class="font-medium text-blue-900">Movimentação de Estoque</span>
      </div>
      <p class="text-sm text-blue-800">
        Configure os valores contábeis do produto. As informações básicas do produto devem ser
        cadastradas na view "Produtos".
      </p>
    </div>

    <div class="space-y-4">
      <div class="space-y-2">
        <label for="product-select" class="text-sm font-medium">Produto *</label>
        <Dropdown
          id="product-select"
          v-model="productData.productId"
          :options="productStore.products"
          optionLabel="name"
          optionValue="id"
          placeholder="Selecione um produto cadastrado"
          :filter="true"
          class="w-full"
        >
          <template #option="slotProps">
            <div class="flex items-center gap-2">
              <i class="pi pi-box h-3 w-3"></i>
              <div>
                <div class="font-medium">{{ slotProps.option.name }}</div>
                <div class="text-xs text-surface-500">
                  {{ slotProps.option.sku }} • {{ slotProps.option.brand }}
                </div>
              </div>
            </div>
          </template>
        </Dropdown>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="space-y-2">
          <label for="quantity" class="text-sm font-medium">Quantidade *</label>
          <InputNumber
            id="quantity"
            v-model="productData.quantity"
            mode="decimal"
            placeholder="Digite a quantidade do produto"
            class="w-full"
          />
        </div>

        <div class="space-y-2">
          <label for="unit-cost" class="text-sm font-medium">Custo Unitário</label>
          <div class="p-2 w-full bg-surface-50 border border-surface-300 rounded-md text-surface-700">
            {{ selectedProductDetails?.cost ? selectedProductDetails.cost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'N/A' }}
          </div>
        </div>
      </div>

      <Card v-if="selectedProductDetails" class="p-4 bg-surface-50">
        <template #content>
          <div class="space-y-2">
            <h5 class="font-medium">Produto Selecionado</h5>
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-surface-500">Nome: </span>
                <span class="font-medium">{{ selectedProductDetails.name }}</span>
              </div>
              <div>
                <span class="text-surface-500">Categoria: </span>
                <span class="font-medium">{{ selectedProductDetails.category }}</span>
              </div>
              <div>
                <span class="text-surface-500">Estoque Atual: </span>
                <span class="font-medium"
                  >{{ selectedProductDetails.currentStock }} {{ selectedProductDetails.unitType }}</span
                >
              </div>
              <div>
                <span class="text-surface-500">Método de Custeio: </span>
                <span class="font-medium">{{ selectedProductDetails.costingMethod?.toUpperCase() }}</span>
              </div>
            </div>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>
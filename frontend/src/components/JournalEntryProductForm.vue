<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useProductStore } from '@/stores/productStore'
import { useToast } from 'primevue/usetoast'
import Dropdown from 'primevue/dropdown'
import type { Product } from '@/types/index'

const productStore = useProductStore()
const toast = useToast()

const selectedProduct = ref(null)

const emit = defineEmits(['product-selected'])

onMounted(() => {
  productStore.fetchProducts(1, 1000) // Fetch all products
})

watch(selectedProduct, (newValue: Product | null) => {
  if (newValue) {
    emit('product-selected', newValue)
  }
})
</script>

<template>
  <div class="space-y-4">
    <div class="p-4 bg-blue-50 rounded-lg">
      <div class="flex items-center gap-2 mb-2">
        <i class="pi pi-search text-blue-600"></i>
        <span class="font-medium text-blue-900">Selecionar Produto Existente</span>
      </div>
      <p class="text-sm text-blue-800">
        Selecione um produto existente para associar à linha de lançamento.
      </p>
    </div>

    <div class="flex flex-col">
      <label for="existing-product" class="text-surface-700 font-medium mb-1">Produto Existente:</label>
      <Dropdown
        v-model="selectedProduct"
        :options="productStore.products"
        optionLabel="name"
        placeholder="Selecione um Produto"
        :filter="true"
        class="w-full"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import { useProductStore } from '@/stores/productStore'
import { useAuthStore } from '@/stores/authStore'
import BaseTable from '@/components/BaseTable.vue'
import type { Product } from '@/types'
import { useToast } from 'primevue/usetoast'
import Skeleton from 'primevue/skeleton'

const newProductName = ref('')
const newProductIcmsRate = ref(0)

async function handleAddProduct() {
  if (!newProductName.value || newProductIcmsRate.value < 0) {
    toast.add({
      severity: 'error',
      summary: 'Erro de Validação',
      detail: 'Por favor, preencha o nome do produto e uma alíquota de ICMS válida.',
      life: 3000,
    })
    return
  }

  try {
    await productStore.addProduct({
      name: newProductName.value,
      icms_rate: newProductIcmsRate.value,
      unit_cost: 0, // Default to 0, can be updated later if needed
      current_stock: 0, // Default to 0, can be updated later if needed
    })
    toast.add({
      severity: 'success',
      summary: 'Sucesso',
      detail: 'Produto adicionado com sucesso!',
      life: 3000,
    })
    newProductName.value = ''
    newProductIcmsRate.value = 0
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido ao adicionar o produto.'
    toast.add({ severity: 'error', summary: 'Erro', detail: message, life: 3000 })
  }
}

const productStore = useProductStore()
const authStore = useAuthStore()
const toast = useToast()

type ProductTableHeader = {
  key: keyof Product | 'actions'
  label: string
  align?: 'left' | 'center' | 'right'
}

const headers: ProductTableHeader[] = [
  { key: 'name', label: 'Nome', align: 'left' },
  { key: 'icms_rate', label: 'Alíquota ICMS (%)', align: 'center' },
  { key: 'actions', label: 'Ações', align: 'center' },
]

async function handleDeleteProduct(id: string) {
  if (confirm('Tem certeza de que deseja excluir este produto?')) {
    try {
      await productStore.deleteProduct(id)
      toast.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: 'Produto excluído com sucesso!',
        life: 3000,
      })
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Ocorreu um erro desconhecido ao excluir o produto.'
      toast.add({ severity: 'error', summary: 'Erro', detail: message, life: 3000 })
    }
  }
}

watchEffect(() => {
  if (!authStore.loading && authStore.isLoggedIn) {
    productStore.fetchProducts()
  }
})
</script>

<template>
  <div class="p-4 sm:p-6 max-w-7xl mx-auto">
    <h1 class="text-2xl font-bold mb-4 text-center text-surface-800">Gerenciar Produtos</h1>

    <div class="bg-surface-50 p-6 rounded-lg shadow-md mb-6">
      <h2 class="text-xl font-semibold mb-3 text-surface-700 border-b border-surface-200 pb-2">Adicionar Novo Produto</h2>
      <form @submit.prevent="handleAddProduct" class="space-y-4">
        <div class="flex flex-col">
          <label for="product-name" class="block text-sm font-medium text-surface-700">Nome do Produto:</label>
          <input type="text" id="product-name" v-model="newProductName" required class="mt-1 block w-full rounded-md border-surface-300 shadow-sm focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50 p-2" />
        </div>
        <div class="flex flex-col">
          <label for="icms-rate" class="block text-sm font-medium text-surface-700">Alíquota de ICMS (%):</label>
          <input
            type="number"
            id="icms-rate"
            v-model.number="newProductIcmsRate"
            step="0.01"
            min="0"
            required
            class="mt-1 block w-full rounded-md border-surface-300 shadow-sm focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50 p-2"
          />
        </div>
        <button type="submit" class="px-4 py-2 bg-emerald-400 text-white rounded-md hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-50">Adicionar Produto</button>
      </form>
    </div>

    <div class="bg-surface-50 p-6 rounded-lg shadow-md">
      <h2 class="text-xl font-semibold mb-3 text-surface-700 border-b border-surface-200 pb-2">Produtos Existentes</h2>
      <div v-if="productStore.loading">
        <Skeleton height="2rem" class="mb-2"></Skeleton>
        <Skeleton height="2rem" class="mb-2"></Skeleton>
        <Skeleton height="2rem"></Skeleton>
      </div>
      <p v-else-if="productStore.error" class="text-red-500 text-center mt-4">{{ productStore.error }}</p>
      <BaseTable
        v-else
        :headers="headers"
        :items="productStore.products"
        empty-message="Nenhum produto encontrado. Adicione um novo produto acima."
      >
        <template #cell(icms_rate)="{ value }"> {{ (value as number).toFixed(2) }}% </template>
        <template #cell(actions)="{ item }">
          <button @click="handleDeleteProduct(item.id as string)" class="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50">
            Excluir
          </button>
        </template>
      </BaseTable>
    </div>
  </div>
</template>


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
  <div class="products-container">
    <h1>Gerenciar Produtos</h1>

    <div class="form-section">
      <h2>Adicionar Novo Produto</h2>
      <form @submit.prevent="handleAddProduct">
        <div class="form-group">
          <label for="product-name">Nome do Produto:</label>
          <input type="text" id="product-name" v-model="newProductName" required />
        </div>
        <div class="form-group">
          <label for="icms-rate">Alíquota de ICMS (%):</label>
          <input
            type="number"
            id="icms-rate"
            v-model.number="newProductIcmsRate"
            step="0.01"
            min="0"
            required
          />
        </div>
        <button type="submit">Adicionar Produto</button>
      </form>
    </div>

    <div class="products-list-section">
      <h2>Produtos Existentes</h2>
      <div v-if="productStore.loading">
        <Skeleton height="2rem" class="mb-2"></Skeleton>
        <Skeleton height="2rem" class="mb-2"></Skeleton>
        <Skeleton height="2rem"></Skeleton>
      </div>
      <p v-else-if="productStore.error" class="error-message">{{ productStore.error }}</p>
      <BaseTable
        v-else
        :headers="headers"
        :items="productStore.products"
        empty-message="Nenhum produto encontrado. Adicione um novo produto acima."
      >
        <template #cell(icms_rate)="{ value }"> {{ (value as number).toFixed(2) }}% </template>
        <template #cell(actions)="{ item }">
          <button @click="handleDeleteProduct(item.id as string)" class="delete-button">
            Excluir
          </button>
        </template>
      </BaseTable>
    </div>
  </div>
</template>

<style scoped>
.products-container {
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;
  font-family: Arial, sans-serif;
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
}

.form-section,
.products-list-section {
  background-color: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  padding: 20px;
  margin-bottom: 30px;
}

h2 {
  color: #555;
  margin-top: 0;
  margin-bottom: 20px;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  color: #666;
  font-weight: bold;
}

.form-group input[type='text'],
.form-group input[type='number'] {
  width: calc(100% - 22px);
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1em;
}

button {
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1em;
  margin-right: 10px;
}

button[type='submit'] {
  background-color: #007bff;
  color: white;
}

button[type='submit']:hover {
  background-color: #0056b3;
}

.delete-button {
  background-color: #dc3545;
  color: white;
}

.delete-button:hover {
  background-color: #c82333;
}

.error-message {
  color: #dc3545;
  text-align: center;
  margin-top: 10px;
}
</style>
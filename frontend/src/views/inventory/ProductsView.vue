<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useProductStore } from '@/stores/productStore'
import type { Product } from '@/types'

import Skeleton from 'primevue/skeleton'
import { useToast } from 'primevue/usetoast'
import Paginator from 'primevue/paginator'

import ProductFormModal from '../../components/ProductFormModal.vue'

const productStore = useProductStore()
const toast = useToast()

const displayModal = ref(false)
const isEditing = ref(false)
const editingProduct = ref<Product | null>(null)
const searchTerm = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(10)

const filteredProducts = computed(() => {
  const lowerCaseSearchTerm = searchTerm.value.toLowerCase()
  if (!lowerCaseSearchTerm) {
    return productStore.products
  }
  return productStore.products.filter(
    (product) =>
      product.name.toLowerCase().includes(lowerCaseSearchTerm) ||
      (product.icms_rate ?? 0).toString().includes(lowerCaseSearchTerm),
  )
})

const totalRecords = computed(() => {
  return productStore.totalProducts
})

const paginatedProducts = computed(() => {
  return filteredProducts.value
})

function onPageChange(event: { page: number; first: number; rows: number; pageCount?: number }) {
  currentPage.value = event.page + 1
  itemsPerPage.value = event.rows
  productStore.fetchProducts(currentPage.value, itemsPerPage.value)
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

watch(searchTerm, () => {
  currentPage.value = 1
  productStore.fetchProducts(currentPage.value, itemsPerPage.value)
})

function openNewProductModal() {
  isEditing.value = false
  editingProduct.value = null
  displayModal.value = true
}

function startEdit(product: Product) {
  isEditing.value = true
  editingProduct.value = { ...product }
  displayModal.value = true
}

async function handleModalSubmitSuccess() {
  displayModal.value = false
  isEditing.value = false
  editingProduct.value = null
  await productStore.fetchProducts(currentPage.value, itemsPerPage.value) // Refresh products after add/edit
}

async function handleDeleteProduct(product: Product) {
  if (!product.id) {
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: 'ID do produto inválido.',
      life: 3000,
    })
    return
  }

  if (confirm('Tem certeza de que deseja excluir este produto?')) {
    try {
      await productStore.deleteProduct(product.id)
      toast.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: 'Produto excluído com sucesso!',
        life: 3000,
      })
      await productStore.fetchProducts(currentPage.value, itemsPerPage.value)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.'
      toast.add({ severity: 'error', summary: 'Erro', detail: message, life: 3000 })
    }
  }
}

onMounted(async () => {
  await productStore.fetchProducts(currentPage.value, itemsPerPage.value)
})
</script>

<template>
  <div>
    <div class="max-w-7xl mx-auto">
      <div class="mb-6 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
        <div class="relative flex-grow">
          <input
            type="text"
            v-model="searchTerm"
            placeholder="Busque um produto"
            class="w-full pl-10 pr-4 py-2 border border-surface-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
          />
          <i
            class="pi pi-search absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-surface-400"
          ></i>
        </div>

        <button
          @click="openNewProductModal"
          class="bg-emerald-400 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out"
        >
          Novo Produto
        </button>
      </div>

      <ProductFormModal
        :visible="displayModal"
        :isEditing="isEditing"
        :editingProduct="editingProduct"
        @update:visible="displayModal = $event"
        @submitSuccess="handleModalSubmitSuccess"
      />

      <div class="overflow-hidden">
        <div
          class="hidden md:grid grid-cols-12 gap-4 p-4 font-bold text-surface-400 border border-surface-200 uppercase text-sm"
        >
          <div class="col-span-6">NOME</div>
          <div class="col-span-2">Estoque Atual</div>
          <div class="col-span-2">Custo Unit.</div>
          <div class="col-span-2 text-center">AÇÕES</div>
        </div>

        <div v-if="productStore.loading" class="p-4 space-y-4">
          <div v-for="i in itemsPerPage" :key="i" class="grid grid-cols-1 md:grid-cols-12 gap-4 p-2 items-center">
            <div class="md:col-span-6"><Skeleton height="1rem" width="80%" class="bg-surface-200" /></div>
            <div class="md:col-span-2"><Skeleton height="1rem" width="50%" class="bg-surface-200" /></div>
            <div class="md:col-span-2"><Skeleton height="1rem" width="50%" class="bg-surface-200" /></div>
            <div class="md:col-span-2 flex justify-center items-center space-x-2">
              <Skeleton shape="circle" size="1.5rem" class="bg-surface-200" />
              <Skeleton shape="circle" size="1.5rem" class="bg-surface-200" />
            </div>
          </div>
        </div>
        <p v-else-if="productStore.error" class="text-red-400 text-center p-8">
          {{ productStore.error }}
        </p>
        <p v-else-if="productStore.products.length === 0" class="text-surface-400 text-center p-8">
          Nenhum produto encontrado.
        </p>

        <div v-else>
          <div
            v-for="product in productStore.products"
            :key="product.id"
            class="border-b border-surface-200 last:border-b-0"
          >
            <div
              class="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 items-center hover:bg-surface-50 transition"
            >
              <div class="md:col-span-6 text-surface-800">{{ product.name }}</div>
              <div class="md:col-span-2 text-surface-700">{{ product.current_stock }}</div>
              <div class="md:col-span-2 text-surface-700">
                {{
                  formatCurrency(
                    product.unit_cost !== null && product.unit_cost !== undefined
                      ? product.unit_cost
                      : 0,
                  )
                }}
              </div>
              <div class="md:col-span-2 flex justify-center items-center space-x-2">
                <button
                  @click="startEdit(product)"
                  class="p-2 rounded-full hover:bg-yellow-100 text-yellow-600 transition duration-300 ease-in-out"
                  title="Editar"
                >
                  <i class="pi pi-pencil w-5 h-5"></i>
                </button>
                <button
                  @click="handleDeleteProduct(product)"
                  class="p-2 rounded-full hover:bg-red-100 text-red-600 transition duration-300 ease-in-out"
                  title="Excluir"
                >
                  <i class="pi pi-trash w-5 h-5"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
        <Paginator
        v-if="productStore.totalProducts > itemsPerPage"
        :rows="itemsPerPage"
        :totalRecords="productStore.totalProducts"
        :rowsPerPageOptions="[10, 20, 50]"
        @page="onPageChange"
        template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
      ></Paginator>
      </div>
    </div>
  </div>
</template>
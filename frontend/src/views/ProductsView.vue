<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useProductStore } from '@/stores/productStore'
import type { Product } from '@/types'

import ProgressSpinner from 'primevue/progressspinner'
import Skeleton from 'primevue/skeleton'

import { Form, Field, ErrorMessage } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'

import { useToast } from 'primevue/usetoast'

const productStore = useProductStore()
const toast = useToast()

const isEditing = ref(false)
const editingProduct = ref<Product | null>(null)
const searchTerm = ref('')
const currentPage = ref(1)
const itemsPerPage = 10

const zodSchema = z.object({
  name: z
    .string({ required_error: 'O nome é obrigatório' })
    .min(3, 'O nome deve ter pelo menos 3 caracteres.'),
  icms_rate: z
    .number({
      required_error: 'A alíquota é obrigatória',
      invalid_type_error: 'A alíquota deve ser um número',
    })
    .min(0, 'A alíquota não pode ser negativa.'),
})

const productSchema = toTypedSchema(zodSchema)

type ProductFormValues = z.infer<typeof zodSchema>

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

const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredProducts.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredProducts.value.length / itemsPerPage)
})

function goToPage(page: number) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

watch(searchTerm, () => {
  currentPage.value = 1
})

async function handleSubmit(values: ProductFormValues, { resetForm }: { resetForm: () => void }) {
  try {
    if (isEditing.value && editingProduct.value) {
      const updatedProduct: Partial<Product> = {
        name: values.name,
        icms_rate: values.icms_rate,
      }
      await productStore.updateProduct(editingProduct.value.id, updatedProduct)
      toast.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: 'Produto atualizado com sucesso!',
        life: 3000,
      })
      isEditing.value = false
      editingProduct.value = null
    } else {
      const newProduct: Omit<Product, 'id' | 'organization_id' | 'user_id'> = {
        name: values.name,
        icms_rate: values.icms_rate,
        current_stock: 0,
        unit_cost: 0,
      }
      await productStore.addProduct(newProduct)
      toast.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: 'Produto adicionado com sucesso!',
        life: 3000,
      })
    }
    resetForm()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.'
    toast.add({ severity: 'error', summary: 'Erro', detail: message, life: 3000 })
  }
}

function startEdit(product: Product) {
  isEditing.value = true
  editingProduct.value = { ...product }
  window.scrollTo(0, 0)
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.'
      toast.add({ severity: 'error', summary: 'Erro', detail: message, life: 3000 })
    }
  }
}

onMounted(() => {
  productStore.fetchProducts()
})
</script>

<template>
  <div class="p-4 sm:p-6">
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
          @click="
            isEditing = !isEditing;
            editingProduct = null
          "
          class="bg-emerald-400 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out"
        >
          {{ isEditing || editingProduct ? 'Fechar Formulário' : 'Novo Produto' }}
        </button>
      </div>

      <div v-if="isEditing" class="bg-surface-50 p-6 rounded-lg shadow-inner mb-6">
        <h2 class="text-2xl font-semibold text-surface-700 mb-4">
          {{ editingProduct ? 'Editar Produto' : 'Adicionar Produto' }}
        </h2>
        <Form
          @submit="handleSubmit as any"
          :validation-schema="productSchema"
          :initial-values="editingProduct || { icms_rate: 0 }"
          v-slot="{ isSubmitting }"
          class="space-y-4"
        >
          <div class="flex flex-col">
            <label for="productName" class="text-surface-700 font-medium mb-1"
              >Nome do Produto:</label
            >
            <Field
              name="name"
              type="text"
              id="productName"
              class="p-3 border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <ErrorMessage name="name" class="text-red-500 text-sm mt-1" />
          </div>
          <div class="flex flex-col">
            <label for="icmsRate" class="text-surface-700 font-medium mb-1"
              >Alíquota de ICMS (%):</label
            >
            <Field
              name="icms_rate"
              type="number"
              id="icmsRate"
              step="0.01"
              class="p-3 border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <ErrorMessage name="icms_rate" class="text-red-500 text-sm mt-1" />
          </div>
          <div class="flex space-x-4">
            <button
              type="submit"
              :disabled="isSubmitting"
              class="bg-emerald-400 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out flex items-center justify-center"
            >
              <ProgressSpinner
                v-if="isSubmitting"
                class="w-5 h-5 mr-2"
                strokeWidth="8"
                fill="var(--surface-ground)"
                animationDuration=".5s"
                aria-label="Custom ProgressSpinner"
              />
              <span v-else>{{ editingProduct ? 'Atualizar Produto' : 'Adicionar Produto' }}</span>
            </button>
          </div>
        </Form>
      </div>

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
          <Skeleton height="3rem" class="mb-2 bg-surface-200" />
          <Skeleton height="3rem" class="mb-2 bg-surface-200" />
          <Skeleton height="3rem" class="bg-surface-200" />
        </div>
        <p v-else-if="productStore.error" class="text-red-400 text-center p-8">
          {{ productStore.error }}
        </p>
        <p v-else-if="paginatedProducts.length === 0" class="text-surface-400 text-center p-8">
          Nenhum produto encontrado.
        </p>

        <div v-else>
          <div
            v-for="product in paginatedProducts"
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
        <div class="flex flex-wrap justify-center mt-6 space-x-2" v-if="totalPages > 1">
          <button
            @click="goToPage(currentPage - 1)"
            :disabled="currentPage === 1"
            class="p-2 rounded-full bg-surface-200 hover:bg-surface-300 text-surface-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i class="pi pi-angle-left w-5 h-5"></i>
          </button>
          <button
            v-for="page in totalPages"
            :key="page"
            @click="goToPage(page)"
            class="px-4 py-2 rounded-full font-semibold"
          >
            {{ page }}
          </button>
          <button
            @click="goToPage(currentPage + 1)"
            :disabled="currentPage === totalPages"
            class="p-2 rounded-full bg-surface-200 hover:bg-surface-300 text-surface-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i class="pi pi-angle-right w-5 h-5"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

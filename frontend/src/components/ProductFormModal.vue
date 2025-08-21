<script setup lang="ts">
import { ref, watch } from 'vue'
import { useProductStore } from '@/stores/productStore'
import type { Product } from '@/types'

import ProgressSpinner from 'primevue/progressspinner'
import Dialog from 'primevue/dialog'

import { Form, Field, ErrorMessage } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'

import { useToast } from 'primevue/usetoast'

const productStore = useProductStore()
const toast = useToast()

const props = defineProps<{
  visible: boolean
  isEditing: boolean
  editingProduct: Product | null
}>()

const emit = defineEmits(['update:visible', 'submitSuccess'])

const displayModal = ref(props.visible)

watch(
  () => props.visible,
  (value) => {
    displayModal.value = value
  },
)

watch(displayModal, (value) => {
  emit('update:visible', value)
})

const zodSchema = z.object({
  name: z
    .string({ required_error: 'O nome é obrigatório' })
    .min(3, 'O nome deve ter pelo menos 3 caracteres.'),
  ncm: z.string().length(8, 'O NCM deve ter 8 dígitos.').optional(),
  sku: z.string().optional(),
  category: z.string({ required_error: 'A categoria é obrigatória' }),
  brand: z.string().optional(),
  min_stock: z.coerce.number({ invalid_type_error: 'Deve ser um número' }).optional(),
  description: z.string().optional(),
  unit_type: z.string().optional(),
  
  
})

const productSchema = toTypedSchema(zodSchema)

type ProductFormValues = z.infer<typeof zodSchema>

async function handleSubmit(values: ProductFormValues, { resetForm }: { resetForm: () => void }) {
  try {
    if (props.isEditing && props.editingProduct) {
      const updatedProduct: Partial<Product> = {
        name: values.name,
        ncm: values.ncm,
        sku: values.sku,
        category: values.category,
        brand: values.brand,
        min_stock: values.min_stock,
        description: values.description,
        unit_type: values.unit_type,
        
      }
      await productStore.updateProduct(props.editingProduct.id, updatedProduct)
      toast.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: 'Produto atualizado com sucesso!',
        life: 3000,
      })
    } else {
      const newProduct: Omit<Product, 'id' | 'organization_id' | 'user_id'> = {
        name: values.name,
        ncm: values.ncm,
        sku: values.sku,
        category: values.category,
        brand: values.brand,
        min_stock: values.min_stock,
        description: values.description,
        unit_type: values.unit_type,
        quantity_in_stock: 0,
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
    emit('submitSuccess')
    displayModal.value = false // Close modal on success
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.'
    toast.add({ severity: 'error', summary: 'Erro', detail: message, life: 3000 })
  }
}
</script>

<template>
  <Dialog
    v-model:visible="displayModal"
    modal
    :header="props.isEditing ? 'Editar Produto' : 'Novo Produto'"
    :style="{ width: '50vw' }"
    :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
  >
    <div class="p-4">
      <p class="text-surface-600 mb-4">Adicione um novo produto ao catálogo</p>
      <Form
        @submit="handleSubmit as any"
        :validation-schema="productSchema"
        :initial-values="
          props.editingProduct || {
            
            min_stock: 0,
            unit_type: 'Unidade',
          }
        "
        v-slot="{ isSubmitting }"
        class="space-y-4"
      >
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex flex-col">
            <label for="productName" class="text-surface-700 font-medium mb-1"
              >Nome do Produto *</label
            >
            <Field
              name="name"
              type="text"
              id="productName"
              placeholder="Ex: Smartphone Samsung Galaxy"
              class="p-3 border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <ErrorMessage name="name" class="text-red-500 text-sm mt-1" />
          </div>
          <div class="flex flex-col">
            <label for="productNcm" class="text-surface-700 font-medium mb-1">NCM</label>
            <Field
              name="ncm"
              type="text"
              id="productNcm"
              placeholder="Ex: 33049910"
              class="p-3 border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <ErrorMessage name="ncm" class="text-red-500 text-sm mt-1" />
          </div>
          <div class="flex flex-col">
            <label for="productSku" class="text-surface-700 font-medium mb-1">SKU</label>
            <Field
              name="sku"
              type="text"
              id="productSku"
              placeholder="Ex: SM-GAL-S24"
              class="p-3 border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <ErrorMessage name="sku" class="text-red-500 text-sm mt-1" />
          </div>
          <div class="flex flex-col">
            <label for="productCategory" class="text-surface-700 font-medium mb-1"
              >Categoria *</label
            >
            <Field
              name="category"
              as="select"
              id="productCategory"
              class="p-3 border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <option value="" disabled>Selecione a Categoria</option>
              <option value="Informática">Informática</option>
              <option value="Impressoras">Impressoras</option>
              <option value="Periféricos">Periféricos</option>
              <option value="Mobiliário">Mobiliário</option>
              <option value="Serviços">Serviços</option>
              <option value="Geral">Geral</option>
            </Field>
            <ErrorMessage name="category" class="text-red-500 text-sm mt-1" />
          </div>
          <div class="flex flex-col">
            <label for="productBrand" class="text-surface-700 font-medium mb-1">Marca</label>
            <Field
              name="brand"
              type="text"
              id="productBrand"
              placeholder="Ex: Samsung"
              class="p-3 border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <ErrorMessage name="brand" class="text-red-500 text-sm mt-1" />
          </div>
          <div class="flex flex-col">
            <label for="minimumStock" class="text-surface-700 font-medium mb-1"
              >Estoque Mínimo</label
            >
            <Field
              name="min_stock"
              type="number"
              id="minimumStock"
              class="p-3 border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <ErrorMessage name="min_stock" class="text-red-500 text-sm mt-1" />
          </div>
          
        </div>

        <div class="flex flex-col">
          <label for="productDescription" class="text-surface-700 font-medium mb-1"
            >Descrição</label
          >
          <Field
            name="description"
            as="textarea"
            id="productDescription"
            placeholder="Descrição detalhada do produto"
            class="p-3 border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
            rows="3"
          />
          <ErrorMessage name="description" class="text-red-500 text-sm mt-1" />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div class="flex flex-col">
            <label for="productUnit" class="text-surface-700 font-medium mb-1">Unidade</label>
            <Field
              name="unit_type"
              as="select"
              id="productUnit"
              class="p-3 border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <option value="Unidade">Unidade</option>
              <option value="Caixa">Caixa</option>
              <option value="Peça">Peça</option>
              <option value="Serviço">Serviço</option>
            </Field>
            <ErrorMessage name="unit_type" class="text-red-500 text-sm mt-1" />
          </div>
        </div>

        <div class="flex justify-end space-x-4 mt-6">
          <button
            type="button"
            @click="displayModal = false"
            class="px-4 py-2 rounded-lg border border-surface-300 text-surface-700 hover:bg-surface-50 transition duration-300"
          >
            Cancelar
          </button>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="bg-gray-800 hover:bg-gray-900 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out flex items-center justify-center"
          >
            <ProgressSpinner
              v-if="isSubmitting"
              class="w-5 h-5 mr-2"
              strokeWidth="8"
              fill="var(--surface-ground)"
              animationDuration=".5s"
              aria-label="Custom ProgressSpinner"
            />
            <span v-else>{{ props.isEditing ? 'Atualizar Produto' : 'Adicionar Produto' }}</span>
          </button>
        </div>
      </Form>
    </div>
  </Dialog>
</template>

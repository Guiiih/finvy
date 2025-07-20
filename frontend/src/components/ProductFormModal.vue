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

watch(() => props.visible, (value) => {
  displayModal.value = value
})

watch(displayModal, (value) => {
  emit('update:visible', value)
})

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

async function handleSubmit(values: ProductFormValues, { resetForm }: { resetForm: () => void }) {
  try {
    if (props.isEditing && props.editingProduct) {
      const updatedProduct: Partial<Product> = {
        name: values.name,
        icms_rate: values.icms_rate,
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
    :header="props.isEditing ? 'Editar Produto' : 'Adicionar Produto'"
    :style="{ width: '50vw' }"
    :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
  >
    <div class="p-6 rounded-lg shadow-inner mb-6">
      <Form
        @submit="handleSubmit as any"
        :validation-schema="productSchema"
        :initial-values="props.editingProduct || { icms_rate: 0 }"
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
            <span v-else>{{ props.isEditing ? 'Atualizar Produto' : 'Adicionar Produto' }}</span>
          </button>
        </div>
      </Form>
    </div>
  </Dialog>
</template>

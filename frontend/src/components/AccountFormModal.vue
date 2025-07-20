<script setup lang="ts">
import { ref, watch } from 'vue'
import { useAccountStore } from '@/stores/accountStore'
import type { Account } from '@/types'

import ProgressSpinner from 'primevue/progressspinner'
import Dialog from 'primevue/dialog' // Import Dialog component

import { Form, Field, ErrorMessage } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'

import { useToast } from 'primevue/usetoast'

const accountStore = useAccountStore()
const toast = useToast()

const props = defineProps<{
  visible: boolean
  isEditing: boolean
  editingAccount: Account | null
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
  parent_account_id: z.string({ required_error: 'A conta pai é obrigatória.' }),
})

const accountSchema = toTypedSchema(zodSchema)

type AccountFormValues = z.infer<typeof zodSchema>

async function handleSubmit(values: AccountFormValues, { resetForm }: { resetForm: () => void }) {
  try {
    if (props.isEditing && props.editingAccount) {
      const updatedAccount: Partial<Account> = {
        name: values.name,
        parent_account_id: values.parent_account_id,
      }
      await accountStore.updateAccount(
        props.editingAccount.id,
        updatedAccount as Omit<Account, 'id'>,
      )
      toast.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: 'Conta atualizada com sucesso!',
        life: 3000,
      })
    } else {
      const newAccount: Omit<Account, 'id' | 'code' | 'type'> = {
        name: values.name,
        parent_account_id: values.parent_account_id,
      }

      await accountStore.addAccount({
        ...newAccount,
        user_id: '', // This will be set by the backend
        organization_id: '', // This will be set by the backend
        accounting_period_id: '', // This will be set by the backend
      } as Omit<Account, 'id'>)
      toast.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: 'Conta adicionada com sucesso!',
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
    :header="props.isEditing ? 'Editar Conta' : 'Adicionar Conta'"
    :style="{ width: '50vw' }"
    :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
  >
    <div class="p-6 rounded-lg shadow-inner mb-6">
      <Form
        @submit="handleSubmit as any"
        :validation-schema="accountSchema"
        :initial-values="props.editingAccount || {}"
        v-slot="{ isSubmitting }"
        class="space-y-4"
      >
        <div class="flex flex-col">
          <label for="parentAccount" class="text-surface-700 font-medium mb-1">Conta Pai:</label>
          <Field
            name="parent_account_id"
            as="select"
            id="parentAccount"
            class="p-3 border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            <option value="" disabled>Selecione...</option>
            <option
              v-for="account in accountStore.accounts"
              :key="account.id"
              :value="account.id"
            >
              {{ account.code }} - {{ account.name }}
            </option>
          </Field>
          <ErrorMessage name="parent_account_id" class="text-red-500 text-sm mt-1" />
        </div>
        <div class="flex flex-col">
          <label for="accountName" class="text-surface-700 font-medium mb-1"
            >Nome da Conta:</label
          >
          <Field
            name="name"
            type="text"
            id="accountName"
            class="p-3 border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
          <ErrorMessage name="name" class="text-red-500 text-sm mt-1" />
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
            <span v-else>{{ props.isEditing ? 'Atualizar Conta' : 'Adicionar Conta' }}</span>
          </button>
        </div>
      </Form>
    </div>
  </Dialog>
</template>

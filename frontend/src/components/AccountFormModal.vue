<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useAccountStore } from '@/stores/accountStore'
import type { Account, AccountType } from '@/types'

import ProgressSpinner from 'primevue/progressspinner'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'
import AutoComplete from 'primevue/autocomplete'

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
const selectedAccountType = ref<AccountType | ''>('')
const parentAccounts = ref<Account[]>([])

const fiscalOperationItems = ref<string[]>([])
const suggestedFiscalOperations = [
  'Venda de Mercadorias',
  'Venda de Serviços',
  'Compra de Matéria-Prima',
  'Compra de Serviços',
  'Compra para Revenda',
  'Devolução de Venda',
  'Devolução de Compra',
]

const searchFiscalOperation = (event: { query: string }) => {
  setTimeout(() => {
    if (!event.query.trim().length) {
      fiscalOperationItems.value = [...suggestedFiscalOperations]
    } else {
      fiscalOperationItems.value = suggestedFiscalOperations.filter((item) => {
        return item.toLowerCase().startsWith(event.query.toLowerCase())
      })
    }
  }, 250)
}

const flattenedParentAccounts = computed(() => {
  return flattenHierarchy(parentAccounts.value)
})

watch(
  () => props.visible,
  (value) => {
    displayModal.value = value
    if (value && props.isEditing && props.editingAccount) {
      selectedAccountType.value = props.editingAccount.type
    } else {
      selectedAccountType.value = ''
    }
  },
)

watch(displayModal, (value) => {
  emit('update:visible', value)
})

watch(selectedAccountType, async (newType) => {
  if (newType) {
    parentAccounts.value = await accountStore.fetchAccountsByType(newType)
  } else {
    parentAccounts.value = []
  }
})

const flattenHierarchy = (accounts: Account[]) => {
  const accountMap = new Map(accounts.map((acc) => [acc.id, { ...acc, children: [] as Account[] }]))
  const roots: Account[] = []

  accounts.forEach((acc) => {
    if (acc.parent_account_id && accountMap.has(acc.parent_account_id)) {
      accountMap.get(acc.parent_account_id)!.children.push(acc as Account)
    } else {
      roots.push(acc)
    }
  })

  const flattened: { id: string; name: string }[] = []
  const traverse = (account: Account, depth: number) => {
    flattened.push({
      id: account.id,
      name: `${'\u00A0\u00A0\u00A0\u00A0'.repeat(depth)} ${account.code} - ${account.name}`,
    })
    const children = accountMap.get(account.id)?.children
    if (children) {
      children
        .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))
        .forEach((child) => traverse(child, depth + 1))
    }
  }

  roots
    .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))
    .forEach((root) => traverse(root, 0))
  return flattened
}

const zodSchema = z.object({
  name: z
    .string({ required_error: 'O nome é obrigatório' })
    .min(3, 'O nome deve ter pelo menos 3 caracteres.'),
  account_type: z.string({ required_error: 'O tipo de conta é obrigatório.' }),
  parent_account_id: z.string({ required_error: 'A conta pai é obrigatória.' }),
  fiscal_operation_type: z.string().optional().nullable(),
})

const accountSchema = toTypedSchema(zodSchema)

type AccountFormValues = z.infer<typeof zodSchema>

async function handleSubmit(values: AccountFormValues, { resetForm }: { resetForm: () => void }) {
  try {
    if (props.isEditing && props.editingAccount) {
      const updatedAccount: Partial<Account> = {
        name: values.name,
        parent_account_id: values.parent_account_id,
        type: values.account_type as AccountType,
        fiscal_operation_type: values.fiscal_operation_type,
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
      const newAccount: Omit<Account, 'id' | 'code'> = {
        name: values.name,
        parent_account_id: values.parent_account_id,
        type: values.account_type as AccountType,
        fiscal_operation_type: values.fiscal_operation_type,
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
    displayModal.value = false
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
        v-slot="{ isSubmitting, setFieldValue }"
        class="space-y-4"
      >
        <div class="flex flex-col">
          <label for="accountType" class="text-surface-700 font-medium mb-1">Tipo de Conta:</label>
          <Field
            name="account_type"
            as="select"
            id="accountType"
            class="p-3 border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
            v-model="selectedAccountType"
          >
            <option value="" disabled>Selecione...</option>
            <option value="asset">Ativo</option>
            <option value="liability">Passivo</option>
            <option value="equity">Patrimônio Líquido</option>
            <option value="revenue">Receita</option>
            <option value="expense">Despesa</option>
          </Field>
          <ErrorMessage name="account_type" class="text-red-500 text-sm mt-1" />
        </div>
        <div class="flex flex-col">
          <label for="parentAccount" class="text-surface-700 font-medium mb-1">Conta Pai:</label>
          <Field name="parent_account_id" v-slot="{ value }">
            <Select
              :options="flattenedParentAccounts"
              :modelValue="value"
              @update:modelValue="(val) => setFieldValue('parent_account_id', val)"
              optionLabel="name"
              optionValue="id"
              placeholder="Selecione a conta pai"
              :filter="true"
              class="w-full"
            />
          </Field>
          <ErrorMessage name="parent_account_id" class="text-red-500 text-sm mt-1" />
        </div>
        <div class="flex flex-col">
          <label for="accountName" class="text-surface-700 font-medium mb-1">Nome da Conta:</label>
          <Field
            name="name"
            type="text"
            id="accountName"
            class="p-3 border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
          '''<ErrorMessage name="name" class="text-red-500 text-sm mt-1" />
        </div>
        <div class="flex flex-col">
          <label for="fiscalOperationType" class="text-surface-700 font-medium mb-1"
            >Tipo de Operação Fiscal (Opcional):</label
          >
          <Field name="fiscal_operation_type" v-slot="{ value, handleChange }">
            <AutoComplete
              :modelValue="value"
              @update:modelValue="handleChange"
              :suggestions="fiscalOperationItems"
              @complete="searchFiscalOperation"
              placeholder="Ex: Venda de Mercadorias"
              class="w-full"
            />
          </Field>
          <ErrorMessage name="fiscal_operation_type" class="text-red-500 text-sm mt-1" />
        </div>
        <div class="flex space-x-4">''
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

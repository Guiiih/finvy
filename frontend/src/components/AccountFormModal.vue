<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useAccountStore } from '@/stores/accountStore'
import type { Account, AccountType } from '@/types'

import AutoComplete from 'primevue/autocomplete'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'

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

const accountTypes = [
  { label: 'Ativo', value: 'asset' },
  { label: 'Passivo', value: 'liability' },
  { label: 'Patrimônio Líquido', value: 'equity' },
  { label: 'Receita', value: 'revenue' },
  { label: 'Despesa', value: 'expense' },
]

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
    :style="{ width: '500px' }"
    :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
    @hide="() => emit('update:visible', false)"
  >
    <template #header>
      <div class="flex flex-col">
        <h3 class="text-lg font-semibold">
          {{ props.isEditing ? 'Editar Conta' : 'Nova Conta' }}
        </h3>
        <p class="text-surface-600 dark:text-surface-400 text-sm">
          Adicione uma nova conta ao plano de contas
        </p>
      </div>
    </template>
    <Form
      @submit="handleSubmit as any"
      :validation-schema="accountSchema"
      :initial-values="props.editingAccount || {}"
      v-slot="{ isSubmitting, setFieldValue }"
    >
      <!-- Tipo Field -->
      <div class="flex flex-col">
        <label for="accountType" class="text-surface-700 text-sm  mb-2">Tipo *</label>
          <Field name="account_type" v-slot="{ value }">
            <Select
              :options="accountTypes"
              optionLabel="label"
              optionValue="value"
              :modelValue="value"
              @update:modelValue="(val) => { setFieldValue('account_type', val); selectedAccountType = val; }"
              placeholder="Selecione..."
              size="small"
            />
          </Field>
        <ErrorMessage name="account_type" class="text-red-500 text-sm mt-1" />
      </div>

      <!-- Conta Pai Field -->
      <div class="flex flex-col mt-4">
        <label for="parentAccount" class="text-surface-700 text-sm  mb-2">Conta Pai *</label>
          <Field name="parent_account_id" v-slot="{ value }">
            <Select
              :options="flattenedParentAccounts"
              :modelValue="value"
              @update:modelValue="(val) => setFieldValue('parent_account_id', val)"
              optionLabel="name"
              optionValue="id"
              placeholder="Selecione uma conta pai"
              :filter="true"
              size="small"
            />
          </Field>
        <ErrorMessage name="parent_account_id" class="text-red-500 text-sm mt-1" />
      </div>

      <!-- Tipo de Operação Fiscal Field -->
      <div class="flex flex-col mt-4">
        <label for="fiscalOperationType" class="text-surface-700 text-sm mb-2">
            Tipo de Operação Fiscal
          </label>
          <Field name="fiscal_operation_type" v-slot="{ value, handleChange }">
            <AutoComplete
              :modelValue="value"
              @update:modelValue="handleChange"
              :suggestions="fiscalOperationItems"
              @complete="searchFiscalOperation"
              placeholder="Ex: Venda de Mercadorias"
              size="small"
              inputClass="p-inputtext-sm w-full"
            />
          </Field>
        <ErrorMessage name="fiscal_operation_type" class="text-red-500 text-sm mt-1" />
      </div>

      <!-- Nome Field -->
      <div class="flex flex-col mt-4">
        <label for="accountName" class="text-surface-700 text-sm  mb-2">Nome *</label>
          <Field name="name" v-slot="{ field }">
            <InputText v-bind="field" id="accountName" placeholder="Nome da conta" class="p-inputtext-sm" />
          </Field>
        <ErrorMessage name="name" class="text-red-500 text-sm mt-1" />
      </div>

      <div class="flex justify-end gap-2 mt-8">
        <Button
          label="Cancelar"
          severity="secondary"
          outlined
          @click="displayModal = false"
          type="button"
          size="small"
        />
        <Button
          :label="props.isEditing ? 'Salvar Alterações' : 'Criar Conta'"
          type="submit"
          :loading="isSubmitting"
          size="small"
        />
      </div>
    </Form>
  </Dialog>
</template>
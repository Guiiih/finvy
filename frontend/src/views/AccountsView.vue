<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAccountStore } from '@/stores/accountStore'
import type { Account } from '@/types'
import BaseTable from '@/components/BaseTable.vue'

import ProgressSpinner from 'primevue/progressspinner'
import Skeleton from 'primevue/skeleton'

import { Form, Field, ErrorMessage } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'

import { useToast } from 'primevue/usetoast'

const accountStore = useAccountStore()
const toast = useToast()

const isEditing = ref(false)
const editingAccount = ref<Account | null>(null)
const searchTerm = ref('')
const currentPage = ref(1)
const itemsPerPage = 10

const accountSchema = toTypedSchema(
  z.object({
    name: z
      .string({ required_error: 'O nome é obrigatório' })
      .min(3, 'O nome deve ter pelo menos 3 caracteres.'),
    type: z.enum(['asset', 'liability', 'equity', 'revenue', 'expense'], {
      required_error: 'Por favor, selecione um tipo.',
    }),
  }),
)

const filteredAccounts = computed(() => {
  const lowerCaseSearchTerm = searchTerm.value.toLowerCase()
  return accountStore.accounts.filter(
    (account) =>
      account.name.toLowerCase().includes(lowerCaseSearchTerm) ||
      account.code?.toString().includes(lowerCaseSearchTerm) ||
      account.type.toLowerCase().includes(lowerCaseSearchTerm),
  )
})

const paginatedAccounts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredAccounts.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredAccounts.value.length / itemsPerPage)
})

function goToPage(page: number) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

type AccountTableHeader = {
  key: keyof Account | 'actions'
  label: string
  align?: 'left' | 'center' | 'right'
}
const headers: AccountTableHeader[] = [
  { key: 'code', label: 'CÓDIGO', align: 'left' },
  { key: 'name', label: 'NOME', align: 'left' },
  { key: 'type', label: 'TIPO', align: 'left' },
  { key: 'actions', label: 'AÇÕES', align: 'center' },
]

async function handleSubmit(
  values: Omit<Account, 'id'> | Partial<Account>,
  { resetForm }: { resetForm: () => void },
) {
  try {
    if (isEditing.value && editingAccount.value) {
      await accountStore.updateAccount(editingAccount.value.id, values as Omit<Account, 'id'>)
      toast.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: 'Conta atualizada com sucesso!',
        life: 3000,
      })
      isEditing.value = false
      editingAccount.value = null
    } else {
      await accountStore.addAccount(values as Omit<Account, 'id'>)
      toast.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: 'Conta adicionada com sucesso!',
        life: 3000,
      })
    }
    resetForm()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.'
    toast.add({ severity: 'error', summary: 'Erro', detail: message, life: 3000 })
  }
}

function startEdit(account: Account) {
  isEditing.value = true
  editingAccount.value = { ...account }
}

function cancelEdit() {
  isEditing.value = false
  editingAccount.value = null
}

async function handleDeleteAccount(id: string | undefined) {
  if (!id) {
    toast.add({
      severity: 'warn',
      summary: 'Aviso',
      detail: 'Não foi possível deletar a conta: ID inválido.',
      life: 3000,
    });
    console.error('Tentativa de deletar conta com ID indefinido.');
    return;
  }

  if (confirm('Tem certeza de que deseja excluir esta conta?')) {
    try {
      await accountStore.deleteAccount(id);
      toast.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: 'Conta excluída com sucesso!',
        life: 3000,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido ao deletar.';
      toast.add({ severity: 'error', summary: 'Erro', detail: message, life: 3000 });
      console.error('Erro ao deletar conta:', err);
    }
  }
}

onMounted(() => {
  accountStore.fetchAccounts()
})
</script>

<template>
  <div>
    <div class="max-w-7xl mx-auto p-8">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold text-gray-800">Gerenciar Contas Contábeis</h1>
      </div>

      <div class="mb-6 flex items-center space-x-4">
        <div class="relative flex-grow">
          <input
            type="text"
            v-model="searchTerm"
            placeholder="Busque uma conta"
            class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg
            class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            ></path>
          </svg>
        </div>
        
        <button
          @click="isEditing = !isEditing; if (!isEditing) editingAccount = null"
          class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out"
        >
          {{ isEditing || editingAccount ? 'Fechar Formulário' : 'Nova Conta' }}
        </button>
      </div>


      <div v-if="isEditing || editingAccount" class="bg-gray-50 p-6 rounded-lg shadow-inner mb-6">
        <h2 class="text-2xl font-semibold text-gray-700 mb-4">{{ isEditing ?'Adicionar Conta' : 'Editar Conta' }}</h2>
        <Form
          @submit="handleSubmit"
          :validation-schema="accountSchema"
          :initial-values="editingAccount || {}"
          v-slot="{ isSubmitting }"
          class="space-y-4"
        >
          <div class="flex flex-col">
            <label for="accountName" class="text-gray-700 font-medium mb-1">Nome da Conta:</label>
            <Field
              name="name"
              type="text"
              id="accountName"
              class="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <ErrorMessage name="name" class="text-red-500 text-sm mt-1" />
          </div>
          <div class="flex flex-col">
            <label for="accountType" class="text-gray-700 font-medium mb-1">Tipo:</label>
            <Field
              name="type"
              as="select"
              id="accountType"
              class="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled>Selecione...</option>
              <option value="asset">Ativo</option>
              <option value="liability">Passivo</option>
              <option value="equity">Patrimônio Líquido</option>
              <option value="revenue">Receita</option>
              <option value="expense">Despesa</option>
            </Field>
            <ErrorMessage name="type" class="text-red-500 text-sm mt-1" />
          </div>
          <div class="flex space-x-4">
            <button
              type="submit"
              :disabled="isSubmitting"
              class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out flex items-center justify-center"
            >
              <ProgressSpinner v-if="isSubmitting" class="w-5 h-5 mr-2" strokeWidth="8" fill="var(--surface-ground)" animationDuration=".5s" aria-label="Custom ProgressSpinner" />
              <span v-else>{{ isEditing ? 'Adicionar Conta' : 'Atualizar Conta'  }}</span>
            </button>
            
          </div>
        </Form>
      </div>

      <div class="p-6">
        <div v-if="accountStore.loading" class="space-y-4">
          <Skeleton height="3rem" class="mb-2" />
          <Skeleton height="3rem" class="mb-2" />
          <Skeleton height="3rem" />
        </div>
        <p v-else-if="accountStore.error" class="text-red-500 text-center text-lg">{{ accountStore.error }}</p>
        <BaseTable
          :headers="headers"
          :items="paginatedAccounts"
          empty-message="Nenhuma conta encontrada. Adicione uma nova conta acima."
        >
          <template #cell(code)="{ value }">
            <span class="font-mono text-gray-700">{{ value }}</span>
          </template>
          <template #cell(type)="{ value }">
            <span
              :class="{
                'bg-blue-100 text-blue-800': value === 'asset',
                'bg-red-100 text-red-800': value === 'liability',
                'bg-green-100 text-green-800': value === 'equity',
                'bg-purple-100 text-purple-800': value === 'revenue',
                'bg-yellow-100 text-yellow-800': value === 'expense',
                'px-2.5 py-0.5 rounded-full text-xs font-medium': true,
              }"
            >
              {{ value }}
            </span>
          </template>
          <template #cell(actions)="{ item }">
            <div class="flex items-center space-x-2">
              <button
                @click="startEdit(item)"
                class="p-2 rounded-full hover:bg-yellow-100 text-yellow-600 transition duration-300 ease-in-out"
                title="Editar"
              >
                <svg
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.232z"
                  ></path>
                </svg>
              </button>
              <button
                @click="handleDeleteAccount(item.id)"
                class="p-2 rounded-full hover:bg-red-100 text-red-600 transition duration-300 ease-in-out"
                title="Excluir"
              >
                <svg
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  ></path>
                </svg>
              </button>
            </div>
          </template>
        </BaseTable>

        <p v-if="paginatedAccounts.length === 0 && !accountStore.loading && !accountStore.error" class="text-gray-400 text-center p-8">
          Nenhuma conta encontrada.
        </p>

        <div class="flex justify-center mt-6 space-x-2" v-if="totalPages > 1">
          <button
            @click="goToPage(currentPage - 1)"
            :disabled="currentPage === 1"
            class="p-2 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 19l-7-7 7-7"
              ></path>
            </svg>
          </button>
          <button
            v-for="page in totalPages"
            :key="page"
            @click="goToPage(page)"
            :class="[
              'px-4 py-2 rounded-full font-semibold',
              currentPage === page ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700',
            ]"
          >
            {{ page }}
          </button>
          <button
            @click="goToPage(currentPage + 1)"
            :disabled="currentPage === totalPages"
            class="p-2 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              ></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useAccountStore } from '@/stores/accountStore'
import type { Account } from '@/types'


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

const zodSchema = z.object({
  name: z
    .string({ required_error: 'O nome é obrigatório' })
    .min(3, 'O nome deve ter pelo menos 3 caracteres.'),
  parent_account_id: z.string({ required_error: 'A conta pai é obrigatória.' }),
});

const accountSchema = toTypedSchema(zodSchema);

type AccountFormValues = z.infer<typeof zodSchema>;

const groupedAndFilteredAccounts = computed(() => {
  const lowerCaseSearchTerm = searchTerm.value.toLowerCase();
  const filtered = accountStore.accounts.filter(account => 
    !account.is_protected &&
    (account.name.toLowerCase().includes(lowerCaseSearchTerm) ||
     account.code?.toString().includes(lowerCaseSearchTerm) ||
     account.type.toLowerCase().includes(lowerCaseSearchTerm))
  );

  const grouped = filtered.reduce((acc, account) => {
    const type = account.type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(account);
    return acc;
  }, {} as Record<string, Account[]>);

  for (const type in grouped) {
    grouped[type].sort((a, b) => (a.code || '').localeCompare(b.code || '', undefined, { numeric: true, sensitivity: 'base' }));
  }

  return grouped;
});

const paginatedAccounts = computed(() => {
  const allAccounts: Account[] = [];
  const types = ['asset', 'liability', 'equity', 'revenue', 'expense'];
  
  types.forEach(type => {
    if (groupedAndFilteredAccounts.value[type]) {
      allAccounts.push(...groupedAndFilteredAccounts.value[type]);
    }
  });

  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return allAccounts.slice(start, end);
});

const totalPages = computed(() => {
    const allAccounts: Account[] = [];
  const types = ['asset', 'liability', 'equity', 'revenue', 'expense'];
  
  types.forEach(type => {
    if (groupedAndFilteredAccounts.value[type]) {
      allAccounts.push(...groupedAndFilteredAccounts.value[type]);
    }
  });

  return Math.ceil(allAccounts.length / itemsPerPage);
});

function goToPage(page: number) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

watch(currentPage, (newPage) => {
  // Não é mais necessário buscar do servidor, a paginação é no cliente
});



async function handleSubmit(
  values: AccountFormValues,
  { resetForm }: { resetForm: () => void },
) {
  try {
    if (isEditing.value && editingAccount.value) {
      // Logic for editing an account
      const updatedAccount: Partial<Account> = {
        name: values.name,
        parent_account_id: values.parent_account_id,
      };
      await accountStore.updateAccount(editingAccount.value.id, updatedAccount as Omit<Account, 'id'>);
      toast.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: 'Conta atualizada com sucesso!',
        life: 3000,
      });
      isEditing.value = false;
      editingAccount.value = null;
    } else {
      // Logic for adding a new account
      const newAccount: Omit<Account, 'id' | 'code' | 'type'> = {
        name: values.name,
        parent_account_id: values.parent_account_id,
      };

      await accountStore.addAccount({
        ...newAccount,
        user_id: '', // This will be set by the backend
        organization_id: '', // This will be set by the backend
        accounting_period_id: '', // This will be set by the backend
      } as Omit<Account, 'id'>);
      toast.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: 'Conta adicionada com sucesso!',
        life: 3000,
      });
    }
    resetForm();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.';
    toast.add({ severity: 'error', summary: 'Erro', detail: message, life: 3000 });
  }
}

function startEdit(account: Account) {
  if (account.is_protected) {
    toast.add({
      severity: 'warn',
      summary: 'Aviso',
      detail: 'Esta conta é protegida e não pode ser editada.',
      life: 3000,
    });
    return;
  }
  isEditing.value = true;
  editingAccount.value = { ...account };
}



async function handleDeleteAccount(account: Account) {
  if (account.is_protected) {
    toast.add({
      severity: 'warn',
      summary: 'Aviso',
      detail: 'Esta conta é protegida e não pode ser excluída.',
      life: 3000,
    });
    return;
  }

  if (!account.id) {
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
      await accountStore.deleteAccount(account.id);
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
  accountStore.fetchAccounts();
})
</script>

<template>
  <div class="p-4 sm:p-6">
    <div class="max-w-7xl mx-auto">
      <div class="flex justify-between items-center">
        
      </div>

      <div class="mb-6 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
        <div class="relative flex-grow">
          <input
            type="text"
            v-model="searchTerm"
            placeholder="Busque uma conta"
            class="w-full pl-10 pr-4 py-2 border border-surface-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
          />
          <i class="pi pi-search absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-surface-400"></i>
        </div>
        
        <button
          @click="isEditing = !isEditing; editingAccount = null"
          class="bg-emerald-400 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out"
        >
          {{ isEditing || editingAccount ? 'Fechar Formulário' : 'Nova Conta' }}
        </button>
      </div>


      <div v-if="isEditing" class="bg-surface-50 p-6 rounded-lg shadow-inner mb-6">
        <h2 class="text-2xl font-semibold text-surface-700 mb-4">{{ editingAccount ? 'Editar Conta' : 'Adicionar Conta' }}</h2>
        <Form
          @submit="handleSubmit as any"
          :validation-schema="accountSchema"
          :initial-values="editingAccount || {}"
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
              <option v-for="account in accountStore.accounts" :key="account.id" :value="account.id">
                {{ account.code }} - {{ account.name }}
              </option>
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
            <ErrorMessage name="name" class="text-red-500 text-sm mt-1" />
          </div>
          <div class="flex space-x-4">
            <button
              type="submit"
              :disabled="isSubmitting"
              class="bg-emerald-400 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out flex items-center justify-center"
            >
              <ProgressSpinner v-if="isSubmitting" class="w-5 h-5 mr-2" strokeWidth="8" fill="var(--surface-ground)" animationDuration=".5s" aria-label="Custom ProgressSpinner" />
              <span v-else>{{ editingAccount ? 'Atualizar Conta' : 'Adicionar Conta'  }}</span>
            </button>
            
          </div>
        </Form>
      </div>

      <div class="overflow-hidden">
        <div
          class="hidden md:grid grid-cols-12 gap-4 p-4 font-bold text-surface-400 border border-surface-200 uppercase text-sm"
        >
          <div class="col-span-2">CÓDIGO</div>
          <div class="col-span-5">NOME</div>
          <div class="col-span-3">TIPO</div>
          <div class="col-span-2 text-center">AÇÕES</div>
        </div>

        <div v-if="accountStore.loading" class="p-4 space-y-4">
          <Skeleton height="3rem" class="mb-2 bg-surface-200" />
          <Skeleton height="3rem" class="mb-2 bg-surface-200" />
          <Skeleton height="3rem" class="bg-surface-200" />
        </div>
        <p v-else-if="accountStore.error" class="text-red-400 text-center p-8">
          {{ accountStore.error }}
        </p>
        <p
          v-else-if="paginatedAccounts.length === 0"
          class="text-surface-400 text-center p-8"
        >
          Nenhuma conta encontrada.
        </p>

        <div v-else>
          <div
            v-for="account in paginatedAccounts"
            :key="account.id"
            class="border-b border-surface-200 last:border-b-0"
          >
            <div
              class="grid grid-cols-1 md:grid-cols-12 gap-4 p-2 items-center hover:bg-surface-50 transition"
            >
              <div class="md:col-span-2 font-mono text-surface-700">{{ account.code }}</div>
              <div class="md:col-span-5 text-surface-800">{{ account.name }}</div>
              <div class="md:col-span-3">
                <span
                  :class="{
                    'bg-blue-100 text-blue-800': account.type === 'asset',
                    'bg-red-100 text-red-800': account.type === 'liability',
                    'bg-green-100 text-green-800': account.type === 'equity',
                    'bg-purple-100 text-purple-800': account.type === 'revenue',
                    'bg-yellow-100 text-yellow-800': account.type === 'expense',
                    'px-2.5 py-0.5 rounded-full text-xs font-medium': true,
                  }"
                >
                  {{ account.type }}
                </span>
              </div>
              <div class="md:col-span-2 flex justify-center items-center space-x-2">
                <button
                  @click="startEdit(account)"
                  :class="[
                    'p-2 rounded-full hover:bg-yellow-100 text-yellow-600 transition duration-300 ease-in-out',
                    { 'opacity-50 cursor-not-allowed': account.is_protected },
                  ]"
                  title="Editar"
                >
                  <i class="pi pi-pencil w-5 h-5"></i>
                </button>
                <button
                  @click="handleDeleteAccount(account)"
                  :class="[
                    'p-2 rounded-full hover:bg-red-100 text-red-600 transition duration-300 ease-in-out',
                    { 'opacity-50 cursor-not-allowed': account.is_protected },
                  ]"
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
            :class="[
              'px-4 py-2 rounded-full font-semibold',
              currentPage === page ? 'bg-emerald-400 text-white' : 'bg-surface-200 hover:bg-surface-300 text-surface-700',
            ]"
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

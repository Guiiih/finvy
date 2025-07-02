<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useAccountStore } from '@/stores/accountStore';
import type { Account } from '@/types';
import BaseTable from '@/components/BaseTable.vue';

import ProgressSpinner from 'primevue/progressspinner';
import Skeleton from 'primevue/skeleton';

// Importações do VeeValidate e Zod
import { Form, Field, ErrorMessage } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';

import { useToast } from 'primevue/usetoast';

const accountStore = useAccountStore();
const toast = useToast(); // Inicializa o serviço de toast

const isEditing = ref(false);
const editingAccount = ref<Account | null>(null);

// O schema Zod para validação
const accountSchema = toTypedSchema(
  z.object({
    name: z.string({ required_error: 'O nome é obrigatório' }).min(3, 'O nome deve ter pelo menos 3 caracteres.'),
    type: z.enum(['asset', 'liability', 'equity', 'revenue', 'expense'], {
      required_error: 'Por favor, selecione um tipo.',
    }),
  })
);

// Pega as contas da store para a tabela
const filteredAccounts = computed(() => accountStore.accounts);

// Define os cabeçalhos para a BaseTable
type AccountTableHeader = {
  key: keyof Account | 'actions';
  label: string;
  align: 'left' | 'center';
};
const headers: AccountTableHeader[] = [
  { key: 'code', label: 'Código', align: 'left' },
  { key: 'name', label: 'Nome', align: 'left' },
  { key: 'type', label: 'Tipo', align: 'left' },
  { key: 'actions', label: 'Ações', align: 'center' },
];

// Função para lidar com o envio do formulário (adição ou edição)
async function handleSubmit(values: Omit<Account, 'id'> | Partial<Account>, { resetForm }: { resetForm: () => void }) {
  try {
    if (isEditing.value && editingAccount.value) {
      // Modo de edição
      await accountStore.updateAccount(editingAccount.value.id, values);
      toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Conta atualizada com sucesso!', life: 3000 });
      isEditing.value = false;
      editingAccount.value = null;
    } else {
      // Modo de adição
      await accountStore.addAccount(values);
      toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Conta adicionada com sucesso!', life: 3000 });
    }
    resetForm(); // Limpa o formulário após o sucesso
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.';
    toast.add({ severity: 'error', summary: 'Erro', detail: message, life: 3000 });
  }
}

function startEdit(account: Account) {
  isEditing.value = true;
  editingAccount.value = { ...account }; // Clona o objeto para edição
}

function cancelEdit() {
  isEditing.value = false;
  editingAccount.value = null;
}

async function handleDeleteAccount(id: string) {
  if (confirm('Tem certeza de que deseja excluir esta conta?')) {
    await accountStore.deleteAccount(id);
  }
}

onMounted(() => {
  accountStore.fetchAccounts();
});
</script>

<template>
  <div class="accounts-container">
    <h1>Gerenciar Contas Contábeis</h1>

    <div class="form-section">
      <h2>{{ isEditing ? 'Editar Conta' : 'Adicionar Nova Conta' }}</h2>
      
      <Form @submit="handleSubmit" :validation-schema="accountSchema" :initial-values="editingAccount || {}" v-slot="{ isSubmitting }">
        <div class="form-group">
          <label for="accountName">Nome da Conta:</label>
          <Field name="name" type="text" id="accountName" />
          <ErrorMessage name="name" class="error-text" />
        </div>
        <div class="form-group">
          <label for="accountType">Tipo:</label>
          <Field name="type" as="select" id="accountType">
            <option value="" disabled>Selecione...</option>
            <option value="asset">Ativo</option>
            <option value="liability">Passivo</option>
            <option value="equity">Patrimônio Líquido</option>
            <option value="revenue">Receita</option>
            <option value="expense">Despesa</option>
          </Field>
          <ErrorMessage name="type" class="error-text" />
        </div>
                <button type="submit" :disabled="isSubmitting">
          <ProgressSpinner v-if="isSubmitting" style="width: 20px; height: 20px;" strokeWidth="8" />
          <span v-else>{{ isEditing ? 'Atualizar Conta' : 'Adicionar Conta' }}</span>
        </button>
        <button v-if="isEditing" type="button" @click="cancelEdit">Cancelar</button>
      </Form>
    </div>

    <div class="accounts-list-section">
      <h2>Contas Existentes</h2>
      <div v-if="accountStore.loading">
        <Skeleton height="2rem" class="mb-2"></Skeleton>
        <Skeleton height="2rem" class="mb-2"></Skeleton>
        <Skeleton height="2rem"></Skeleton>
      </div>
      <p v-else-if="accountStore.error" class="error-message">{{ accountStore.error }}</p>
      
      <BaseTable
        v-else
        :headers="headers"
        :items="filteredAccounts"
        empty-message="Nenhuma conta encontrada. Adicione uma nova conta acima."
      >
        <template #cell(actions)="{ item }">
          <div class="action-buttons">
            <button @click="startEdit(item)" class="edit-button">Editar</button>
            <button @click="handleDeleteAccount(item.id)" class="delete-button">Excluir</button>
          </div>
        </template>
      </BaseTable>
    </div>
  </div>
</template>

<style scoped>
/* Estilos principais do container */
.accounts-container {
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

.form-section, .accounts-list-section {
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

/* --- Início das Melhorias de Design --- */

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  color: #666;
  font-weight: bold;
}

.form-group input,
.form-group select {
  width: 100%; /* Ocupa a largura total */
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1em;
  box-sizing: border-box; /* Garante que o padding não aumente a largura */
}

/* Estilo para os botões de ação na tabela */
.action-buttons button {
  padding: 5px 10px; /* Botões menores */
  font-size: 0.9em;  /* Texto menor */
  margin-right: 5px; /* Espaçamento entre botões */
  border: 1px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.action-buttons button:last-child {
  margin-right: 0;
}

/* Botão de Editar */
.action-buttons .edit-button {
  background-color: #e9ecef;
  color: #495057;
  border-color: #ced4da;
}
.action-buttons .edit-button:hover {
  background-color: #dee2e6;
}

/* Botão de Excluir */
.action-buttons .delete-button {
  background-color: #f8d7da;
  color: #721c24;
  border-color: #f5c6cb;
}
.action-buttons .delete-button:hover {
  background-color: #f1b0b7;
}

.error-text {
  color: #dc3545;
  font-size: 0.875em;
  margin-top: 4px;
  display: block;
}

/* --- Fim das Melhorias de Design --- */
</style>
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useAccountStore } from '@/stores/accountStore';
import type { Account } from '@/types';
import BaseTable from '@/components/BaseTable.vue';

// Importações do VeeValidate e Zod
import { Form, Field, ErrorMessage } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';

const accountStore = useAccountStore();

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
async function handleSubmit(values: any, { resetForm }: any) {
  try {
    if (isEditing.value && editingAccount.value) {
      // Modo de edição
      await accountStore.updateAccount(editingAccount.value.id, values);
      alert('Conta atualizada com sucesso!');
      isEditing.value = false;
      editingAccount.value = null;
    } else {
      // Modo de adição
      await accountStore.addAccount(values);
      alert('Conta adicionada com sucesso!');
    }
    resetForm(); // Limpa o formulário após o sucesso
  } catch (err: unknown) {
    alert(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
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
        <button type="submit" :disabled="isSubmitting">{{ isEditing ? 'Atualizar Conta' : 'Adicionar Conta' }}</button>
        <button v-if="isEditing" type="button" @click="cancelEdit">Cancelar</button>
      </Form>
    </div>

    <div class="accounts-list-section">
      <h2>Contas Existentes</h2>
      <p v-if="accountStore.loading">Carregando contas...</p>
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
.base-table-container {
  width: 100%;
  overflow-x: auto;
}

.base-table {
  width: 100%;
  border-collapse: collapse;
  margin: 0;
  font-size: 0.95em;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  overflow: hidden;
  table-layout: fixed; /* Adicione esta linha */
}

.base-table thead {
  background-color: #f0f0f0;
}

/* O resto do seu CSS permanece o mesmo... */
.base-table th {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #ddd;
  color: #333;
  font-weight: bold;
  text-transform: uppercase;
}

.base-table td {
  padding: 10px 15px;
  border-bottom: 1px solid #eee;
  color: #555;
}

.base-table tbody tr:last-child td {
  border-bottom: none;
}

.base-table tbody tr:hover {
  background-color: #f5f5f5;
}

.text-left { text-align: left; }
.text-center { text-align: center; }
.text-right { text-align: right; }

.empty-table-message {
  text-align: center;
  padding: 20px;
  color: #888;
  font-style: italic;
  background-color: #f9f9f9;
  border: 1px dashed #ddd;
  border-radius: 8px;
  margin-top: 20px;
}
</style>
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
const headers = [
  { key: 'code', label: 'Código', align: 'left' as const },
  { key: 'name', label: 'Nome', align: 'left' as const },
  { key: 'type', label: 'Tipo', align: 'left' as const },
  { key: 'actions', label: 'Ações', align: 'center' as const },
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
          <button @click="startEdit(item as Account)">Editar</button>
          <button @click="handleDeleteAccount(item.id as string)" class="delete-button">Excluir</button>
        </template>
      </BaseTable>
    </div>
  </div>
</template>

<style scoped>
/* Estilos originais mantidos para consistência */
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

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  color: #666;
  font-weight: bold;
}

/* Estilo para os inputs e selects (VeeValidate <Field> irá usar isto) */
.form-group input,
.form-group select {
  width: calc(100% - 22px);
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1em;
}

button {
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1em;
  margin-right: 10px;
}

button[type="submit"] {
  background-color: #007bff;
  color: white;
}

button[type="submit"]:hover {
  background-color: #0056b3;
}

.delete-button {
  background-color: #dc3545;
  color: white;
}

.delete-button:hover {
  background-color: #c82333;
}

.error-message, .error-text {
  color: #dc3545;
}

.error-text {
  font-size: 0.875em;
  margin-top: 4px;
  display: block;
}

.error-message {
  text-align: center;
  margin-top: 10px;
}
</style>
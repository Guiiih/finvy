<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAccountStore } from '@/stores/accountStore';
import { Form, Field, ErrorMessage } from 'vee-validate'; // 1. Importe os componentes do VeeValidate
import { toTypedSchema } from '@vee-validate/zod'; // 2. Importe o adaptador do Zod
import { z } from 'zod';
import type { Account } from '@/types';
import BaseTable from '@/components/BaseTable.vue';

const accountStore = useAccountStore();

// 3. O seu schema Zod permanece exatamente o mesmo
const accountSchema = toTypedSchema(
  z.object({
    name: z.string({ required_error: 'O nome é obrigatório' }).min(3, 'O nome deve ter pelo menos 3 caracteres.'),
    type: z.enum(['asset', 'liability', 'equity', 'revenue', 'expense'], {
      required_error: 'Por favor, selecione um tipo.',
    }),
  })
);

// O VeeValidate agora lida com o estado do formulário, por isso não precisamos de refs separadas
async function handleAddAccount(values: any, { resetForm }: any) {
  try {
    await accountStore.addAccount(values);
    resetForm(); // O VeeValidate tem uma função para limpar o formulário
  } catch (err: unknown) {
    alert(err instanceof Error ? err.message : 'Erro desconhecido');
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
      <h2>Adicionar Nova Conta</h2>
      <Form @submit="handleAddAccount" :validation-schema="accountSchema" class="form-wrapper">
        <div class="form-group">
          <label for="accountName">Nome da Conta:</label>
          <Field name="name" type="text" id="accountName" class="form-input" />
          <ErrorMessage name="name" class="error-text" />
        </div>
        <div class="form-group">
          <label for="accountType">Tipo:</label>
          <Field name="type" as="select" id="accountType" class="form-input">
            <option value="" disabled>Selecione um tipo</option>
            <option value="asset">Ativo</option>
            <option value="liability">Passivo</option>
            <option value="equity">Patrimônio Líquido</option>
            <option value="revenue">Receita</option>
            <option value="expense">Despesa</option>
          </Field>
          <ErrorMessage name="type" class="error-text" />
        </div>
        <button type="submit">Adicionar Conta</button>
      </Form>
    </div>

    <div class="accounts-list-section">
      </div>
  </div>
</template>

<style scoped>
.error-text {
  color: #dc3545;
  font-size: 0.875em;
  margin-top: 4px;
  display: block;
}
.form-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}
</style>
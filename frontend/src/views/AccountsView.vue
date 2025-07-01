<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAccountStore } from '@/stores/accountStore';
import type { Account } from '@/types';
import BaseTable from '@/components/BaseTable.vue';

const accountStore = useAccountStore();

const newAccountName = ref('');
const newAccountType = ref<Account['type']>('asset');

const isEditing = ref(false);
const editingAccount = ref<Account | null>(null);

const filteredAccounts = computed(() => accountStore.accounts);

const headers = [
  { key: 'code', label: 'Código', align: 'left' as const },
  { key: 'name', label: 'Nome', align: 'left' as const },
  { key: 'type', label: 'Tipo', align: 'left' as const },
  { key: 'actions', label: 'Ações', align: 'center' as const },
];

const accountNameModel = computed({
  get() {
    return isEditing.value && editingAccount.value ? editingAccount.value.name : newAccountName.value;
  },
  set(newValue: string) {
    if (isEditing.value && editingAccount.value) {
      editingAccount.value.name = newValue;
    } else {
      newAccountName.value = newValue;
    }
  }
});

const accountTypeModel = computed({
  get() {
    return isEditing.value && editingAccount.value ? editingAccount.value.type : newAccountType.value;
  },
  set(newValue: Account['type']) {
    if (isEditing.value && editingAccount.value) {
      editingAccount.value.type = newValue;
    } else {
      newAccountType.value = newValue;
    }
  }
});






onMounted(async () => {
  await accountStore.fetchAccounts();
});

async function handleAddAccount() {
  if (!newAccountName.value || !newAccountType.value) {
    alert('Por favor, preencha todos os campos da conta.');
    return;
  }
  try {
    await accountStore.addAccount({
      name: newAccountName.value,
      type: newAccountType.value,
    });
    newAccountName.value = '';
    newAccountType.value = 'asset';
  } catch {
    alert(accountStore.error || 'Erro ao adicionar conta.');
  }
}

function startEdit(account: Account) {
  isEditing.value = true;
  editingAccount.value = { ...account };
}

async function handleUpdateAccount() {
  if (!editingAccount.value || !editingAccount.value.id) return;

  try {
    await accountStore.updateAccount(editingAccount.value.id, {
      name: editingAccount.value.name,
      type: editingAccount.value.type,
    });
    isEditing.value = false;
    editingAccount.value = null;
  } catch {
    alert(accountStore.error || 'Erro ao atualizar conta.');
  }
}

async function handleDeleteAccount(id: string) {
  if (confirm('Tem certeza de que deseja excluir esta conta?')) {
    try {
      await accountStore.deleteAccount(id);
    } catch {
      alert(accountStore.error || 'Erro ao deletar conta.');
    }
  }
}


</script>

<template>
  <div class="accounts-container">
    <h1>Gerenciar Contas Contábeis</h1>

    <div class="form-section">
      <h2>{{ isEditing ? 'Editar Conta' : 'Adicionar Nova Conta' }}</h2>
      <form @submit.prevent="isEditing ? handleUpdateAccount() : handleAddAccount()">
        <div class="form-group">
          <label for="accountName">Nome da Conta:</label>
          <input type="text" id="accountName" v-model="accountNameModel" required />
        </div>
        <div class="form-group">
          <label for="accountType">Tipo:</label>
          <select id="accountType" v-model="accountTypeModel" required>
            <option value="asset">Ativo</option>
            <option value="liability">Passivo</option>
            <option value="equity">Patrimônio Líquido</option>
            <option value="revenue">Receita</option>
            <option value="expense">Despesa</option>
          </select>
        </div>
        <button type="submit">{{ isEditing ? 'Atualizar Conta' : 'Adicionar Conta' }}</button>
        <button v-if="isEditing" type="button" @click="isEditing = false; editingAccount = null">Cancelar</button>
      </form>
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
          <button @click="startEdit(item as unknown as Account)">Editar</button>
          <button @click="handleDeleteAccount(item.id as string)" class="delete-button">Excluir</button>
        </template>
      </BaseTable>
    </div>
  </div>
</template>

<style scoped>

/* Seu CSS existente permanece o mesmo */
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

.form-group input[type="text"],
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

.error-message {
  color: #dc3545;
  text-align: center;
  margin-top: 10px;
}
</style>
<template>
  <div class="accounts">
    <h2>Plano de Contas</h2>
    <p>Aqui estão as contas contábeis da sua empresa. No futuro, você poderá adicionar, editar e remover contas.</p>

    <div class="add-account-section">
      <h3>Adicionar Nova Conta</h3>
      <form @submit.prevent="addNewAccount" class="account-form">
        <div class="form-group">
          <label for="account-name">Nome da Conta:</label>
          <input type="text" id="account-name" v-model="newAccount.name" required />
        </div>
        <div class="form-group">
          <label for="account-code">Código:</label>
          <input type="number" id="account-code" v-model.number="newAccount.code" required />
        </div>
        <div class="form-group">
          <label for="account-type">Tipo:</label>
          <select id="account-type" v-model="newAccount.type" required>
            <option value="">Selecione o Tipo</option>
            <option value="asset">Ativo</option>
            <option value="liability">Passivo</option>
            <option value="equity">Patrimônio Líquido</option>
            <option value="revenue">Receita</option>
            <option value="expense">Despesa</option>
          </select>
        </div>
        <div class="form-group">
          <label for="account-nature">Natureza:</label>
          <select id="account-nature" v-model="newAccount.nature" required>
            <option value="">Selecione a Natureza</option>
            <option value="debit">Débito</option>
            <option value="credit">Crédito</option>
          </select>
        </div>
        <button type="submit">Adicionar Conta</button>
      </form>
    </div>

    <table>
      <thead>
        <tr>
          <th>Nome da Conta</th>
          <th>Código</th>
          <th>Tipo</th>
          <th>Natureza</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="account in accountStore.accounts" :key="account.id">
          <td>{{ account.name }}</td>
          <td>{{ account.code }}</td>
          <td>{{ account.type }}</td>
          <td>{{ account.nature }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAccountStore } from '@/stores/accountStore';
import type { Account } from '@/types/index';

const accountStore = useAccountStore();

const newAccount = ref<Partial<Account>>({
  name: '',
  code: undefined,
  type: undefined,
  nature: undefined,
});

async function addNewAccount() {
  if (newAccount.value.name && newAccount.value.code && newAccount.value.type && newAccount.value.nature) {
    // Temporariamente, adicione um user_id hardcoded para testes
    // Isso será substituído pela lógica de autenticação real na Fase 3
    const accountToSave: Account = {
      id: `acc-${Date.now()}`, // ID temporário, será substituído pelo DB
      name: newAccount.value.name,
      code: Number(newAccount.value.code),
      type: newAccount.value.type,
      nature: newAccount.value.nature,
      user_id: "00000000-0000-0000-0000-000000000000", 
    };
    await accountStore.addAccount(accountToSave);
    // Limpar formulário
    newAccount.value = {
      name: '',
      code: undefined,
      type: undefined,
      nature: undefined,
    };
  } else {
    alert('Por favor, preencha todos os campos da conta.');
  }
}

onMounted(() => {
  accountStore.fetchAccounts();
});
</script>

<style scoped>
.accounts { padding: 1rem; }

.add-account-section {
  background-color: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.account-form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input[type="text"],
.form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.account-form button[type="submit"] {
  grid-column: span 2;
  padding: 10px 15px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.account-form button[type="submit"]:hover {
  background-color: #0056b3;
}

table {
  width: 100%;
  margin-top: 1.5rem;
  border-collapse: collapse;
}
th, td {
  border: 1px solid #e0e0e0;
  padding: 0.75rem;
  text-align: left;
}
th {
  background-color: #f8f8f8;
  font-weight: 600;
}
</style>
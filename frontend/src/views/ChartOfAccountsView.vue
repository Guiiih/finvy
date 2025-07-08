<template>
  <div class="chart-of-accounts-container">
    <h1>Plano de Contas</h1>

    <p v-if="accountStore.loading" class="loading-message">Carregando plano de contas...</p>
    <p v-else-if="accountStore.error" class="error-message">
      Erro ao carregar plano de contas: {{ accountStore.error }}
    </p>
    <p v-else-if="accountStore.accounts.length === 0" class="no-accounts-message">
      Nenhuma conta encontrada. Por favor, adicione contas na tela "Gerenciar Contas Contábeis".
    </p>

    <div v-else class="chart-of-accounts-list">
      <div v-for="type in accountStore.accountTypes" :key="type" class="account-type-section">
        <h2>{{ formatAccountType(type) }}</h2>
        <ul>
          <li v-for="account in accountStore.getAccountsByType(type)" :key="account.id">
            <span class="account-code">{{ account.code }}</span>
            <span class="account-name">{{ account.name }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAccountStore } from '@/stores/accountStore'

const accountStore = useAccountStore()

onMounted(async () => {
  await accountStore.fetchAccounts()
})

const formatAccountType = (type: string) => {
  switch (type) {
    case 'asset':
      return 'Ativo'
    case 'liability':
      return 'Passivo'
    case 'equity':
      return 'Patrimônio Líquido'
    case 'revenue':
      return 'Receita'
    case 'expense':
      return 'Despesa'
    default:
      return type
  }
}
</script>

<style scoped>
.chart-of-accounts-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  font-family: Arial, sans-serif;
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
}

.loading-message,
.error-message,
.no-accounts-message {
  text-align: center;
  padding: 20px;
  background-color: #f9f9f9;
  border: 1px dashed #ddd;
  border-radius: 8px;
  color: #666;
  font-style: italic;
  margin-top: 20px;
}

.error-message {
  background-color: #f8d7da;
  color: #721c24;
  border-color: #f5c6cb;
}

.chart-of-accounts-list {
  background-color: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  padding: 20px;
}

.account-type-section {
  margin-bottom: 25px;
}

.account-type-section h2 {
  color: #007bff;
  border-bottom: 2px solid #007bff;
  padding-bottom: 5px;
  margin-bottom: 15px;
}

.account-type-section ul {
  list-style: none;
  padding: 0;
}

.account-type-section li {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px dashed #eee;
}

.account-type-section li:last-child {
  border-bottom: none;
}

.account-code {
  font-weight: bold;
  color: #555;
  margin-right: 15px;
  min-width: 60px;
}

.account-name {
  color: #333;
  flex-grow: 1;
}
</style>
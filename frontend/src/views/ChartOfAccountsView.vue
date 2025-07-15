<template>
  <div class="p-4 sm:p-6 max-w-7xl mx-auto">
    <h1 class="text-2xl font-bold mb-4 text-center text-surface-800">Plano de Contas</h1>

    <p v-if="accountStore.loading" class="text-center p-4 bg-surface-100 border border-surface-200 rounded-lg text-surface-600 italic mt-4">
      Carregando plano de contas...
    </p>
    <p v-else-if="accountStore.error" class="text-center p-4 bg-red-100 border border-red-200 rounded-lg text-red-700 mt-4">
      Erro ao carregar plano de contas: {{ accountStore.error }}
    </p>
    <p v-else-if="accountStore.accounts.length === 0" class="text-center p-4 bg-surface-100 border border-surface-200 rounded-lg text-surface-600 italic mt-4">
      Nenhuma conta encontrada. Por favor, adicione contas na tela "Gerenciar Contas Contábeis".
    </p>

    <div v-else class="bg-surface-50 p-6 rounded-lg shadow-md">
      <div v-for="type in accountStore.accountTypes" :key="type" class="mb-6 last:mb-0">
        <h2 class="text-xl font-semibold text-emerald-600 border-b-2 border-emerald-600 pb-2 mb-4">{{ formatAccountType(type) }}</h2>
        <ul>
          <li v-for="account in accountStore.getAccountsByType(type)" :key="account.id" class="flex items-center py-2 border-b border-surface-200 last:border-b-0">
            <span class="font-bold text-surface-700 mr-4 min-w-[60px]">{{ account.code }}</span>
            <span class="text-surface-800 flex-grow">{{ account.name }}</span>
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


<template>
  <div class="p-4 sm:p-6 max-w-7xl mx-auto">
    <h1 class="text-2xl font-bold mb-4 text-center text-surface-800">Contas a Receber</h1>

    <div class="bg-surface-50 p-6 rounded-lg shadow-md mb-6">
      <h2 class="text-xl font-semibold mb-3 text-surface-700 border-b border-surface-200 pb-2">{{ isEditing ? 'Editar Conta a Receber' : 'Adicionar Nova Conta a Receber' }}</h2>
      <form
        @submit.prevent="isEditing ? handleUpdateAccountReceivable() : handleAddAccountReceivable()"
        class="space-y-4"
      >
        <div class="flex flex-col">
          <label for="description" class="block text-sm font-medium text-surface-700">Descrição:</label>
          <input type="text" id="description" v-model="newAccount.description" required class="mt-1 block w-full rounded-md border-surface-300 shadow-sm focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50 p-2" />
        </div>
        <div class="flex flex-col">
          <label for="amount" class="block text-sm font-medium text-surface-700">Valor:</label>
          <input
            type="number"
            id="amount"
            v-model.number="newAccount.amount"
            step="0.01"
            min="0"
            required
            class="mt-1 block w-full rounded-md border-surface-300 shadow-sm focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50 p-2"
          />
        </div>
        <div class="flex flex-col">
          <label for="dueDate" class="block text-sm font-medium text-surface-700">Data de Vencimento:</label>
          <input type="date" id="dueDate" v-model="newAccount.due_date" required class="mt-1 block w-full rounded-md border-surface-300 shadow-sm focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50 p-2" />
        </div>
        <div class="flex items-center">
          <input type="checkbox" id="isReceived" v-model="newAccount.is_received" class="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-surface-300 rounded" />
          <label for="isReceived" class="ml-2 block text-sm text-surface-900">Recebida:</label>
        </div>
        <div class="flex flex-col" v-if="newAccount.is_received">
          <label for="receivedDate" class="block text-sm font-medium text-surface-700">Data de Recebimento:</label>
          <input
            type="date"
            id="receivedDate"
            v-model="newAccount.received_date"
            :required="newAccount.is_received"
            class="mt-1 block w-full rounded-md border-surface-300 shadow-sm focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50 p-2"
          />
        </div>
        <div class="flex space-x-2">
          <button type="submit" class="px-4 py-2 bg-emerald-400 text-white rounded-md hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-50">{{ isEditing ? 'Atualizar' : 'Adicionar' }}</button>
          <button type="button" @click="resetForm" v-if="isEditing" class="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50">Cancelar</button>
        </div>
      </form>
    </div>

    <div class="bg-surface-50 p-6 rounded-lg shadow-md mb-6">
      <h2 class="text-xl font-semibold mb-3 text-surface-700 border-b border-surface-200 pb-2">Contas Pendentes</h2>
      <p v-if="financialTransactionsStore.loading" class="text-surface-600">Carregando contas...</p>
      <p v-else-if="financialTransactionsStore.error" class="text-red-500 text-center mt-4">
        {{ financialTransactionsStore.error }}
      </p>
      <div class="overflow-x-auto" v-else-if="financialTransactionsStore.getUnreceivedAccounts.length > 0">
        <table class="min-w-full divide-y divide-surface-200">
          <thead class="bg-surface-100">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">Descrição</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">Valor</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">Vencimento</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-surface-200">
            <tr v-for="account in financialTransactionsStore.getUnreceivedAccounts" :key="account.id">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-surface-900">{{ account.description }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-surface-900">R$ {{ account.amount.toFixed(2) }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-surface-900">{{ account.due_date }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                <button @click="startEdit(account)" class="px-3 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50">Editar</button>
                <button @click="markAsReceived(account.id)" v-if="!account.is_received" class="px-3 py-1 bg-emerald-400 text-white rounded-md hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-50">
                  Marcar como Recebida
                </button>
                <button @click="handleDeleteAccountReceivable(account.id)" class="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50">
                  Excluir
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else class="text-surface-600 mt-4">Nenhuma conta a receber pendente.</p>

      <h2 class="text-xl font-semibold mb-3 text-surface-700 border-b border-surface-200 pb-2 mt-6">Contas Recebidas</h2>
      <div class="overflow-x-auto" v-if="financialTransactionsStore.getReceivedAccounts.length > 0">
        <table class="min-w-full divide-y divide-surface-200">
          <thead class="bg-surface-100">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">Descrição</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">Valor</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">Vencimento</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">Recebimento</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-surface-200">
            <tr v-for="account in financialTransactionsStore.getReceivedAccounts" :key="account.id">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-surface-900">{{ account.description }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-surface-900">R$ {{ account.amount.toFixed(2) }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-surface-900">{{ account.due_date }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-surface-900">{{ account.received_date }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                <button @click="startEdit(account)" class="px-3 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50">Editar</button>
                <button @click="handleDeleteAccountReceivable(account.id)" class="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50">
                  Excluir
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else class="text-surface-600 mt-4">Nenhuma conta a receber recebida.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useFinancialTransactionsStore } from '@/stores/financialTransactionsStore'

interface FinancialTransaction {
  id: string
  description: string
  amount: number
  due_date: string
  paid_date?: string | null
  received_date?: string | null
  is_paid?: boolean
  is_received?: boolean
  created_at: string
}

const financialTransactionsStore = useFinancialTransactionsStore()

const newAccount = ref<Omit<FinancialTransaction, 'id' | 'created_at' | 'is_paid' | 'paid_date'>>({
  description: '',
  amount: 0,
  due_date: '',
  is_received: false,
  received_date: null,
})

const isEditing = ref(false)
const editingAccountId = ref<string | null>(null)

onMounted(() => {
  financialTransactionsStore.fetchFinancialTransactions()
})

async function handleAddAccountReceivable() {
  try {
    await financialTransactionsStore.addFinancialTransaction('receivable', newAccount.value)
    resetForm()
  } catch (error: unknown) {
    if (error instanceof Error) {
      alert(error.message)
    } else {
      alert('Ocorreu um erro desconhecido.')
    }
  }
}

function startEdit(account: FinancialTransaction) {
  isEditing.value = true
  editingAccountId.value = account.id
  newAccount.value = { ...account }
}

async function handleUpdateAccountReceivable() {
  if (!editingAccountId.value) return
  try {
    await financialTransactionsStore.updateFinancialTransaction(
      'receivable',
      editingAccountId.value,
      newAccount.value,
    )
    resetForm()
  } catch (error: unknown) {
    if (error instanceof Error) {
      alert(error.message)
    } else {
      alert('Ocorreu um erro desconhecido.')
    }
  }
}

async function handleDeleteAccountReceivable(id: string) {
  if (confirm('Tem certeza que deseja excluir esta conta a receber?')) {
    try {
      await financialTransactionsStore.deleteFinancialTransaction('receivable', id)
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert(error.message)
      } else {
        alert('Ocorreu um erro desconhecido.')
      }
    }
  }
}

async function markAsReceived(id: string) {
  if (confirm('Marcar esta conta como recebida?')) {
    try {
      await financialTransactionsStore.updateFinancialTransaction('receivable', id, {
        is_received: true,
        received_date: new Date().toISOString().split('T')[0],
      })
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert(error.message)
      } else {
        alert('Ocorreu um erro desconhecido.')
      }
    }
  }
}

function resetForm() {
  isEditing.value = false
  editingAccountId.value = null
  newAccount.value = {
    description: '',
    amount: 0,
    due_date: '',
    is_received: false,
    received_date: null,
  }
}
</script>


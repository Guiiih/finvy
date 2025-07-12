<template>
  <div class="accounts-payable-container">
    <h1>Contas a Pagar</h1>

    <div class="form-section">
      <h2>{{ isEditing ? 'Editar Conta a Pagar' : 'Adicionar Nova Conta a Pagar' }}</h2>
      <form @submit.prevent="isEditing ? handleUpdateAccountPayable() : handleAddAccountPayable()">
        <div class="form-group">
          <label for="description">Descrição:</label>
          <input type="text" id="description" v-model="newAccount.description" required />
        </div>
        <div class="form-group">
          <label for="amount">Valor:</label>
          <input
            type="number"
            id="amount"
            v-model.number="newAccount.amount"
            step="0.01"
            min="0"
            required
          />
        </div>
        <div class="form-group">
          <label for="dueDate">Data de Vencimento:</label>
          <input type="date" id="dueDate" v-model="newAccount.due_date" required />
        </div>
        <div class="form-group">
          <label for="isPaid">Paga:</label>
          <input type="checkbox" id="isPaid" v-model="newAccount.is_paid" />
        </div>
        <div class="form-group" v-if="newAccount.is_paid">
          <label for="paidDate">Data de Pagamento:</label>
          <input
            type="date"
            id="paidDate"
            v-model="newAccount.paid_date"
            :required="newAccount.is_paid"
          />
        </div>
        <button type="submit" class="px-4 py-2 bg-emerald-400 text-white rounded-md hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-50">{{ isEditing ? 'Atualizar' : 'Adicionar' }}</button>
        <button type="button" @click="resetForm" v-if="isEditing" class="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50">Cancelar</button>
      </form>
    </div>

    <div class="accounts-list-section">
      <h2>Contas Pendentes</h2>
      <p v-if="financialTransactionsStore.loading">Carregando contas...</p>
      <p v-else-if="financialTransactionsStore.error" class="error-message">
        {{ financialTransactionsStore.error }}
      </p>
      <table v-else-if="financialTransactionsStore.getUnpaidAccounts.length > 0">
        <thead>
          <tr>
            <th>Descrição</th>
            <th>Valor</th>
            <th>Vencimento</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="account in financialTransactionsStore.getUnpaidAccounts" :key="account.id">
            <td>{{ account.description }}</td>
            <td>R$ {{ account.amount.toFixed(2) }}</td>
            <td>{{ account.due_date }}</td>
            <td>
              <button @click="startEdit(account)" class="px-3 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50">Editar</button>
              <button @click="markAsPaid(account.id)" v-if="!account.is_paid" class="px-3 py-1 bg-emerald-400 text-white rounded-md hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-50">
                Marcar como Paga
              </button>
              <button @click="handleDeleteAccountPayable(account.id)" class="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50">
                Excluir
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-else>Nenhuma conta a pagar pendente.</p>

      <h2>Contas Pagas</h2>
      <table v-if="financialTransactionsStore.getPaidAccounts.length > 0">
        <thead>
          <tr>
            <th>Descrição</th>
            <th>Valor</th>
            <th>Vencimento</th>
            <th>Pagamento</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="account in financialTransactionsStore.getPaidAccounts" :key="account.id">
            <td>{{ account.description }}</td>
            <td>R$ {{ account.amount.toFixed(2) }}</td>
            <td>{{ account.due_date }}</td>
            <td>{{ account.paid_date }}</td>
            <td>
              <button @click="startEdit(account)" class="px-3 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50">Editar</button>
              <button @click="handleDeleteAccountPayable(account.id)" class="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50">
                Excluir
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-else>Nenhuma conta a pagar paga.</p>
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

const newAccount = ref<
  Omit<FinancialTransaction, 'id' | 'created_at' | 'is_received' | 'received_date'>
>({
  description: '',
  amount: 0,
  due_date: '',
  is_paid: false,
  paid_date: null,
})

const isEditing = ref(false)
const editingAccountId = ref<string | null>(null)

onMounted(() => {
  financialTransactionsStore.fetchFinancialTransactions()
})

async function handleAddAccountPayable() {
  try {
    await financialTransactionsStore.addFinancialTransaction('payable', newAccount.value)
    resetForm()
  } catch (err: unknown) {
    alert(err instanceof Error ? err.message : 'Erro desconhecido')
  }
}

function startEdit(account: FinancialTransaction) {
  isEditing.value = true
  editingAccountId.value = account.id
  newAccount.value = { ...account }
}

async function handleUpdateAccountPayable() {
  if (!editingAccountId.value) return
  try {
    await financialTransactionsStore.updateFinancialTransaction(
      'payable',
      editingAccountId.value,
      newAccount.value,
    )
    resetForm()
  } catch (err: unknown) {
    alert(err instanceof Error ? err.message : 'Erro desconhecido')
  }
}

async function handleDeleteAccountPayable(id: string) {
  if (confirm('Tem certeza que deseja excluir esta conta a pagar?')) {
    try {
      await financialTransactionsStore.deleteFinancialTransaction('payable', id)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro desconhecido')
    }
  }
}

async function markAsPaid(id: string) {
  if (confirm('Marcar esta conta como paga?')) {
    try {
      await financialTransactionsStore.updateFinancialTransaction('payable', id, {
        is_paid: true,
        paid_date: new Date().toISOString().split('T')[0],
      })
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro desconhecido')
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
    is_paid: false,
    paid_date: null,
  }
}
</script>

<style scoped>
.accounts-payable-container {
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

.form-section,
.accounts-list-section {
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

.form-group input[type='text'],
.form-group input[type='number'],
.form-group input[type='date'] {
  width: calc(100% - 22px);
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1em;
}

.form-group input[type='checkbox'] {
  margin-top: 8px;
}

.delete-button {
  background-color: #dc3545;
  color: white;
}

.delete-button:hover {
  background-color: #c82333;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

th,
td {
  border: 1px solid #ddd;
  padding: 10px;
  text-align: left;
}

th {
  background-color: #f2f2f2;
}

.error-message {
  color: #dc3545;
  text-align: center;
  margin-top: 10px;
}
</style>
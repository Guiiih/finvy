<template>
  <div class="accounts-receivable-container">
    <h1>Contas a Receber</h1>

    <div class="form-section">
      <h2>{{ isEditing ? 'Editar Conta a Receber' : 'Adicionar Nova Conta a Receber' }}</h2>
      <form
        @submit.prevent="isEditing ? handleUpdateAccountReceivable() : handleAddAccountReceivable()"
      >
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
          <label for="isReceived">Recebida:</label>
          <input type="checkbox" id="isReceived" v-model="newAccount.is_received" />
        </div>
        <div class="form-group" v-if="newAccount.is_received">
          <label for="receivedDate">Data de Recebimento:</label>
          <input
            type="date"
            id="receivedDate"
            v-model="newAccount.received_date"
            :required="newAccount.is_received"
          />
        </div>
        <button type="submit">{{ isEditing ? 'Atualizar' : 'Adicionar' }}</button>
        <button type="button" @click="resetForm" v-if="isEditing">Cancelar</button>
      </form>
    </div>

    <div class="accounts-list-section">
      <h2>Contas Pendentes</h2>
      <p v-if="financialTransactionsStore.loading">Carregando contas...</p>
      <p v-else-if="financialTransactionsStore.error" class="error-message">
        {{ financialTransactionsStore.error }}
      </p>
      <table v-else-if="financialTransactionsStore.getUnreceivedAccounts.length > 0">
        <thead>
          <tr>
            <th>Descrição</th>
            <th>Valor</th>
            <th>Vencimento</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="account in financialTransactionsStore.getUnreceivedAccounts" :key="account.id">
            <td>{{ account.description }}</td>
            <td>R$ {{ account.amount.toFixed(2) }}</td>
            <td>{{ account.due_date }}</td>
            <td>
              <button @click="startEdit(account)">Editar</button>
              <button @click="markAsReceived(account.id)" v-if="!account.is_received">
                Marcar como Recebida
              </button>
              <button @click="handleDeleteAccountReceivable(account.id)" class="delete-button">
                Excluir
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-else>Nenhuma conta a receber pendente.</p>

      <h2>Contas Recebidas</h2>
      <table v-if="financialTransactionsStore.getReceivedAccounts.length > 0">
        <thead>
          <tr>
            <th>Descrição</th>
            <th>Valor</th>
            <th>Vencimento</th>
            <th>Recebimento</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="account in financialTransactionsStore.getReceivedAccounts" :key="account.id">
            <td>{{ account.description }}</td>
            <td>R$ {{ account.amount.toFixed(2) }}</td>
            <td>{{ account.due_date }}</td>
            <td>{{ account.received_date }}</td>
            <td>
              <button @click="startEdit(account)">Editar</button>
              <button @click="handleDeleteAccountReceivable(account.id)" class="delete-button">
                Excluir
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-else>Nenhuma conta a receber recebida.</p>
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

<style scoped>
.accounts-receivable-container {
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

button {
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1em;
  margin-right: 10px;
}

button[type='submit'] {
  background-color: #007bff;
  color: white;
}

button[type='submit']:hover {
  background-color: #0056b3;
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
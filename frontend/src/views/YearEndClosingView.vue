<template>
  <div class="p-4 sm:p-6 max-w-7xl mx-auto">
    <h1 class="text-2xl font-bold mb-4 text-center text-surface-800">Fechamento de Exercício</h1>

    <div class="bg-white p-6 rounded-lg shadow-md mb-6">
      <p class="text-surface-700 mb-4">
        O fechamento de exercício zera as contas de receita e despesa, transferindo o resultado para
        o Patrimônio Líquido.
      </p>
      <p class="text-surface-700 mb-4">Selecione a data de fechamento. Todos os lançamentos até esta data serão considerados.</p>

      <div class="space-y-4">
        <div class="flex flex-col">
          <label for="closingDate" class="block text-sm font-medium text-surface-700 mb-1">Data de Fechamento:</label>
          <input type="date" id="closingDate" v-model="closingDate" required class="mt-1 block w-full rounded-md border-surface-300 shadow-sm focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50 p-2" />
        </div>

        <button @click="handleYearEndClosing" :disabled="loading" class="w-full p-3 bg-emerald-400 text-white rounded-md hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-50 disabled:bg-surface-300 disabled:cursor-not-allowed">
          {{ loading ? 'Processando...' : 'Realizar Fechamento' }}
        </button>

        <p v-if="message" :class="{ 'bg-green-100 text-green-700 border-green-200': !error, 'bg-red-100 text-red-700 border-red-200': error }" class="p-3 rounded-md border text-center mt-4">
          {{ message }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { api } from '@/services/api'

const closingDate = ref('')
const loading = ref(false)
const message = ref<string | null>(null)
const error = ref<string | null>(null)

async function handleYearEndClosing() {
  if (!closingDate.value) {
    message.value = 'Por favor, selecione uma data de fechamento.'
    error.value = 'error'
    return
  }

  loading.value = true
  message.value = null
  error.value = null

  try {
    const response = await api.post<{ message?: string }, { closingDate: string }>(
      '/year-end-closing',
      {
        closingDate: closingDate.value,
      },
    )
    message.value = response.message || 'Fechamento de exercício realizado com sucesso!'
    error.value = null
  } catch (err: unknown) {
    message.value = err instanceof Error ? err.message : 'Erro ao realizar fechamento de exercício.'
    error.value = 'error'
  } finally {
    loading.value = false
  }
}
</script>


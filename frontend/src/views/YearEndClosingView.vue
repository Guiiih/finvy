<template>
  <div class="year-end-closing-container">
    <h1>Fechamento de Exercício</h1>

    <div class="closing-form-section">
      <p>O fechamento de exercício zera as contas de receita e despesa, transferindo o resultado para o Patrimônio Líquido.</p>
      <p>Selecione a data de fechamento. Todos os lançamentos até esta data serão considerados.</p>

      <div class="form-group">
        <label for="closingDate">Data de Fechamento:</label>
        <input type="date" id="closingDate" v-model="closingDate" required />
      </div>

      <button @click="handleYearEndClosing" :disabled="loading">{{ loading ? 'Processando...' : 'Realizar Fechamento' }}</button>

      <p v-if="message" :class="{ 'success-message': !error, 'error-message': error }">{{ message }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { api } from '@/services/api';

const closingDate = ref('');
const loading = ref(false);
const message = ref<string | null>(null);
const error = ref<string | null>(null);

async function handleYearEndClosing() {
  if (!closingDate.value) {
    message.value = 'Por favor, selecione uma data de fechamento.';
    error.value = true;
    return;
  }

  loading.value = true;
  message.value = null;
      error.value = null;

  try {
    const response: { message?: string } = await api.post('/year-end-closing', { closingDate: closingDate.value });
    message.value = response.message || 'Fechamento de exercício realizado com sucesso!';
    error.value = null;
  } catch (error: unknown) {
    message.value = error instanceof Error ? error.message : 'Erro ao realizar fechamento de exercício.';
    error.value = 'error';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.year-end-closing-container {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
  font-family: Arial, sans-serif;
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
}

.closing-form-section {
  background-color: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  padding: 20px;
  margin-bottom: 30px;
}

.closing-form-section p {
  margin-bottom: 15px;
  line-height: 1.5;
  color: #555;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #333;
}

.form-group input[type="date"] {
  width: calc(100% - 22px);
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1em;
}

button {
  padding: 12px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1.1em;
  transition: background-color 0.2s;
}

button:hover:not(:disabled) {
  background-color: #0056b3;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.success-message {
  color: #28a745;
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
  padding: 10px;
  border-radius: 5px;
  margin-top: 20px;
  text-align: center;
}

.error-message {
  color: #dc3545;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  padding: 10px;
  border-radius: 5px;
  margin-top: 20px;
  text-align: center;
}
</style>
<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 sm:p-6">
    <div class="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
      <h2 class="text-2xl font-bold mb-6 text-center text-surface-800">Atualizar Senha</h2>
      <form @submit.prevent="handleUpdatePassword" class="space-y-4">
        <div class="flex flex-col">
          <label for="password" class="block text-sm font-medium text-surface-700 mb-1"
            >Nova Senha:</label
          >
          <input
            type="password"
            id="password"
            v-model="password"
            required
            class="mt-1 block w-full rounded-md border-surface-300 shadow-sm focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50 p-2"
          />
        </div>
        <button
          type="submit"
          class="w-full p-3 bg-emerald-400 text-white rounded-md hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-50"
        >
          Atualizar Senha
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { supabase } from '../supabase'
import { useRouter } from 'vue-router'

const password = ref('')
const router = useRouter()

const handleUpdatePassword = async () => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: password.value,
    })

    if (error) throw error
    alert('Sua senha foi atualizada com sucesso!')
    router.push('/login')
  } catch (error: unknown) {
    if (error instanceof Error) {
      alert(error.message)
    } else {
      alert('Ocorreu um erro desconhecido.')
    }
  }
}
</script>

<style scoped>
.update-password-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #f0f2f5;
  padding: 20px;
}

h2 {
  color: #333;
  margin-bottom: 20px;
}

form {
  background-color: #fff;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  color: #555;
}

input[type='password'] {
  width: calc(100% - 20px);
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}
</style>

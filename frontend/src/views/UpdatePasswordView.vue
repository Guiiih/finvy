<template>
  <div class="update-password-container">
    <h2>Atualizar Senha</h2>
    <form @submit.prevent="handleUpdatePassword">
      <div class="form-group">
        <label for="password">Nova Senha:</label>
        <input type="password" id="password" v-model="password" required />
      </div>
      <button type="submit" class="w-full p-4 bg-emerald-400 text-white rounded-md hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-50">Atualizar Senha</button>
    </form>
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
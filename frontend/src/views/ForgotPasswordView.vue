<template>
  <div class="forgot-password-container">
    <h2>Recuperar Senha</h2>
    <form @submit.prevent="handleForgotPassword">
      <div class="form-group">
        <label for="email">Email:</label>
        <input type="email" id="email" v-model="email" required />
      </div>
      <button type="submit">Enviar link de recuperação</button>
    </form>
    <p>Lembrou da senha? <router-link to="/login">Faça login</router-link></p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { supabase } from '../supabase';
import { useRouter } from 'vue-router';

const email = ref('');
const router = useRouter();

const handleForgotPassword = async () => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.value, {
      redirectTo: window.location.origin + '/update-password',
    });

    if (error) throw error;
    alert('Verifique seu e-mail para o link de recuperação de senha!');
    router.push('/login');
  } catch (error: any) {
    alert(error.message);
  }
};
</script>

<style scoped>
.forgot-password-container {
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

input[type="email"] {
  width: calc(100% - 20px);
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

button {
  width: 100%;
  padding: 10px;
  background-color: #ffc107;
  color: #333;
  border: none;
  border-radius: 4px;
  font-size: 18px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

button:hover {
  background-color: #e0a800;
}

p {
  margin-top: 20px;
  color: #666;
}

p a {
  color: #007bff;
  text-decoration: none;
}

p a:hover {
  text-decoration: underline;
}
</style>

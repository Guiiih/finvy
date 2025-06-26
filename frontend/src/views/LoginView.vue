<template>
  <div class="auth-page-container">
    <div class="auth-left-column">
      <div class="auth-form-wrapper">
        <h2 class="auth-title">Fazer login</h2>
        <form @submit.prevent="handleLogin" class="auth-form">
          <div class="form-group">
            <input type="email" id="email" v-model="email" placeholder="E-mail" required class="auth-input" />
          </div>
          <div class="form-group password-group">
            <input :type="passwordFieldType" id="password" v-model="password" placeholder="Senha" required class="auth-input" />
            <span class="password-toggle" @click="togglePasswordVisibility">
              <svg v-if="passwordFieldType === 'password'" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-eye">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-eye-off">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.54 18.54 0 0 1 2.94-3.5"></path>
                <path d="M2 2l20 20"></path>
                <path d="M13.5 13.5L10.5 10.5"></path>
                <path d="M8.09 5.83A10.07 10.07 0 0 1 12 4c7 0 11 8 11 8a18.54 18.54 0 0 1-2.94 3.5"></path>
              </svg>
            </span>
          </div>
          <div class="form-options">
            <label class="checkbox-container">
              <input type="checkbox" />
              Lembrar-me
            </label>
            <router-link to="/forgot-password" class="forgot-password-link">Esqueci minha senha</router-link>
          </div>
          <button type="submit" class="auth-button">Entrar</button>
        </form>
        <p class="auth-footer-text">Não tem uma conta? <router-link to="/register" class="auth-link">Cadastre-se</router-link></p>
      </div>
    </div>
    <div class="auth-right-column">
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { supabase } from '../supabase';
import { useRouter } from 'vue-router';

const email = ref('');
const password = ref('');
const router = useRouter();
const passwordFieldType = ref('password'); // Para controlar a visibilidade da senha

const togglePasswordVisibility = () => {
  passwordFieldType.value = passwordFieldType.value === 'password' ? 'text' : 'password';
};

const handleLogin = async () => {
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    });

    if (error) throw error;
    router.push('/'); // Redireciona para a página inicial após o login
  } catch (error: any) {
    alert(error.message);
  }
};
</script>

<style scoped>
/* Estilos gerais do container da página de autenticação */
.auth-page-container {
  display: flex;
  min-height: 100vh;
  background-color: #F8F8F8; /* Fundo claro da coluna esquerda */
}

/* Coluna da esquerda (formulário) */
.auth-left-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.auth-form-wrapper {
  max-width: 380px; /* Largura máxima do formulário */
  width: 100%;
  padding: 40px; /* Mais padding para o formulário */
  background-color: #F8F8F8; /* Fundo correspondente à coluna */
  border-radius: 8px;
}

.auth-title {
  color: #333333; /* Cor do título */
  font-size: 2.2em;
  margin-bottom: 25px;
  text-align: left;
  font-weight: 600;
}

.auth-form .form-group {
  margin-bottom: 20px;
  position: relative;
}

.auth-input {
  width: 100%;
  padding: 15px 20px;
  border: none;
  border-radius: 8px;
  background-color: #F0F0F0; /* Fundo cinza claro para inputs */
  font-size: 1em;
  color: #4A4A4A;
  outline: none;
  box-sizing: border-box;
}

.auth-input::placeholder {
  color: #A0A0A0;
}

/* Estilo para o ícone de olho da senha */
.password-group .password-toggle {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: #A0A0A0;
  display: flex; /* Para centralizar o SVG */
  align-items: center;
  justify-content: center;
}

.password-toggle svg {
    width: 20px; /* Tamanho do ícone SVG */
    height: 20px;
}


.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  font-size: 0.9em;
}

.checkbox-container {
  display: flex;
  align-items: center;
  color: #A0A0A0;
}

.checkbox-container input[type="checkbox"] {
  margin-right: 8px;
  width: 16px;
  height: 16px;
  accent-color: #00E676; /* Cor do checkbox quando marcado */
}

.forgot-password-link {
  color: #A0A0A0;
  text-decoration: none;
  transition: color 0.2s ease;
}

.forgot-password-link:hover {
  color: #00E676;
}

.auth-button {
  width: 100%;
  padding: 15px;
  background-color: #00E676; /* Verde vibrante */
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1em;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.auth-button:hover {
  background-color: #00C853; /* Verde um pouco mais escuro no hover */
}

.auth-footer-text {
  margin-top: 30px;
  text-align: center;
  color: #A0A0A0;
  font-size: 0.9em;
}

.auth-link {
  color: #00E676;
  text-decoration: none;
  font-weight: bold;
}

.auth-link:hover {
  text-decoration: underline;
}

/* Coluna da direita (logo) */
.auth-right-column {
  flex: 1;
  background-color: #1A1A1A; /* Fundo escuro para a coluna da direita */
  display: flex;
  align-items: center;
  justify-content: center;
}

.drak-logo {
  max-width: 80%;
  height: auto;
}

/* Responsividade básica */
@media (max-width: 768px) {
  .auth-page-container {
    flex-direction: column;
  }

  .auth-right-column {
    display: none; /* Esconde a coluna do logo em telas menores */
  }

  .auth-left-column {
    flex: none;
    width: 100%;
  }

  .auth-form-wrapper {
    padding: 20px;
  }
}
</style>
<template>
  <div class="auth-page-container">
    <div class="auth-form-column">
      <div class="back-button-wrapper">
        <router-link to="/login" class="back-button">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M15 18L9 12L15 6"></path>
          </svg>
        </router-link>
      </div>
      <div class="auth-form-wrapper">
        <h2 class="auth-title">Eita, esqueceu sua senha?</h2>
        <p class="auth-subtitle">Não esquenta, vamos dar um jeito nisso.</p>
        <form @submit.prevent="handleForgotPassword" class="auth-form">
          <div class="form-group">
            <input
              type="email"
              id="email"
              v-model="email"
              placeholder="E-mail"
              required
              class="auth-input"
            />
          </div>
          <button type="submit" class="auth-button" :disabled="!email">Enviar</button>
        </form>
      </div>
    </div>

    <div class="auth-logo-column">
      <img src="../assets/Finvy Logo.svg" alt="Logo" class="logo" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { supabase } from '../supabase'
import { useRouter } from 'vue-router'

const email = ref('')
const router = useRouter()

const handleForgotPassword = async () => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.value, {
      redirectTo: window.location.origin + '/update-password',
    })

    if (error) throw error
    router.push('/password-reset-success')
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
/* Reset global de margens e paddings é crucial, como em main.css */
/* html, body { margin: 0; padding: 0; } */

.auth-page-container {
  display: flex;
  min-height: 100vh;
  width: 100vw;
  margin: 0;
  padding: 0;
  overflow: hidden;
  background-color: #f8f8f8; /* Fundo claro para a coluna do formulário */
  flex-direction: row;
}

/* Coluna do formulário (clara) à esquerda */
.auth-form-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background-color: #f8f8f8;
  order: 1;
  position: relative; /* Adicionado para posicionar o back-button-wrapper */
}

/* Coluna do logo (escura) à direita */
.auth-logo-column {
  flex: 1;
  background-color: #1a1a1a;
  display: flex;
  align-items: center;
  justify-content: center;
  order: 2;
}

.logo {
  max-width: 30%;
  height: auto;
}

/* NOVO: Estilos para o botão de voltar */
.back-button-wrapper {
  position: absolute;
  top: 40px; /* Distância do topo */
  left: 40px; /* Distância da esquerda */
  z-index: 10;
}

.back-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px; /* Tamanho do círculo do botão */
  height: 40px;
  border-radius: 50%;
  background-color: transparent;
  border: 1px solid #e0e0e0; /* Borda cinza clara, como na imagem */
  cursor: pointer;
  color: #888888; /* Cor da seta */
  transition: background-color 0.2s ease;
  text-decoration: none; /* Remover sublinhado do RouterLink */
}

.back-button:hover {
  background-color: #efefef; /* Pequeno destaque no hover */
}

.auth-form-wrapper {
  max-width: 380px;
  width: 100%;
  padding: 40px;
  background-color: transparent;
  border-radius: 0;
  box-shadow: none;
  box-sizing: border-box;
}

.auth-title {
  color: #333333;
  font-size: 2.2em;
  font-weight: 600;
  margin-bottom: 10px;
  text-align: left;
}

.auth-subtitle {
  color: #a0a0a0;
  font-size: 0.9em;
  margin-bottom: 30px;
  text-align: left;
}

.auth-form .form-group {
  margin-bottom: 20px;
  position: relative;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  padding: 0;
  overflow: hidden;
}

.auth-input {
  width: 100%;
  padding: 15px 20px;
  border: none;
  border-radius: 8px;
  background-color: transparent;
  font-size: 1em;
  color: #4a4a4a;
  outline: none;
  box-sizing: border-box;
}

.auth-input::placeholder {
  color: #a0a0a0;
}

/* Estilos para Inputs Autofill */
.auth-input:-webkit-autofill,
.auth-input:-webkit-autofill:hover,
.auth-input:-webkit-autofill:focus,
.auth-input:-webkit-autofill:active {
  -webkit-box-shadow: 0 0 0px 1000px white inset !important;
  -webkit-text-fill-color: #4a4a4a !important;
  transition: background-color 50000s ease-in-out 0s !important;
}

.auth-button {
  width: 100%;
  padding: 15px;
  background-color: #00e676; /* VERDE por padrão */
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1em;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.auth-button:hover {
  background-color: #00c853; /* Verde um pouco mais escuro no hover */
}

.auth-button:disabled {
  background-color: #e0e0e0; /* Cinza claro quando desabilitado */
  color: #a0a0a0; /* Texto cinza */
  cursor: not-allowed;
}

.auth-button:hover:disabled {
  background-color: #e0e0e0; /* Mantém a cor desabilitada no hover */
}

/* Responsividade básica */
@media (max-width: 600px) {
  .auth-form-column {
    padding: 20px;
  }
  .auth-form-wrapper {
    padding: 20px;
  }
  /* Ajuste a posição do botão de voltar em telas menores */
  .back-button-wrapper {
    top: 20px;
    left: 20px;
  }
}
@media (max-width: 768px) {
  .auth-page-container {
    flex-direction: column;
  }

  .auth-logo-column {
    display: none;
  }

  .auth-form-column {
    flex: none;
    width: 100%;
  }
}
</style>

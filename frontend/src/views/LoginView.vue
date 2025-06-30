<template>
  <div class="auth-page-container">
    <div class="auth-logo-column">
      <img src="../assets/Finvy Logo.svg" alt="Logo" class="logo" />
    </div>

    <div class="auth-form-column">
      <div class="auth-form-wrapper">
        <h2 class="auth-title">Fazer login</h2>
        <form @submit.prevent="handleLogin" class="auth-form">
          <div class="form-group">
            <input type="email" id="email" v-model="email" placeholder="E-mail" required class="auth-input" />
          </div>
          <div class="form-group password-group">
            <input :type="passwordFieldType" id="password" v-model="password" placeholder="Senha" required class="auth-input" />
            <span class="password-toggle" @click="togglePasswordVisibility">
              <span v-if="passwordFieldType === 'password'">🙈</span>
              <span v-else>🙉</span>
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
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { supabase } from '../supabase';
import { useRouter } from 'vue-router';

const email = ref('');
const password = ref('');
const router = useRouter();
const passwordFieldType = ref('password'); 

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
  width: 100vw;
  margin: 0;
  padding: 0;
  overflow: hidden; /* Garante que não haverá barras de rolagem desnecessárias */
  background-color: #F8F8F8; /* Fundo claro para a coluna do formulário (direita) */
}

/* Coluna do logo (visualmente à esquerda) */
.auth-logo-column {
  flex: 1;
  background-color: #1A1A1A; /* Fundo escuro */
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo {
  max-width: 30%;
  height: auto;
}

/* Coluna do formulário (visualmente à direita) */
.auth-form-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px; /* Padding geral da coluna */
  background-color: #F8F8F8; /* Certifica o fundo claro */
}

.auth-form-wrapper {
  max-width: 380px; /* Largura máxima para o conteúdo do formulário */
  width: 100%;
  padding: 0 40px; /* Padding horizontal para afastar do lado da coluna */
  box-sizing: border-box; /* Garante que padding seja incluído na largura */
}

.auth-title {
  color: #333333;
  font-size: 2.2em;
  margin-bottom: 25px;
  text-align: left;
  font-weight: 600;
  margin-top: 0;
}

.auth-form .form-group {
  margin-bottom: 20px;
  position: relative;
}

.auth-input {
  width: 100%;
  padding: 15px 20px;
  border: 1px solid transparent; /* **AJUSTADO:** Bordas transparentes por padrão */
  border-radius: 8px;
  background-color: white; /* **AJUSTADO:** Fundo BRANCO para inputs */
  font-size: 1em;
  color: #4A4A4A; /* Cor do texto padrão */
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s ease;
}

.auth-input:focus {
  border-left: 3px solid #926EEB !important; /* Borda roxa de 3px no lado esquerdo */
  padding-left: 17px !important; /* Ajusta o padding para compensar a borda */
}


.auth-input::placeholder {
  color: #A0A0A0;
}

/* ESTILOS PARA INPUTS PREENCHIDOS / AUTOFILL */
.auth-input:-webkit-autofill,
.auth-input:-webkit-autofill:hover,
.auth-input:-webkit-autofill:focus,
.auth-input:-webkit-autofill:active {
    /* Define a cor de fundo para a cor desejada (BRANCO) */
    -webkit-box-shadow: 0 0 0px 1000px white inset !important;
    /* Define a cor do texto para a cor desejada (cinza escuro) */
    -webkit-text-fill-color: #4A4A4A !important;
    /* Transição para que a mudança de cor seja imediata */
    transition: background-color 50000s ease-in-out 0s !important;
    /* **NOVO:** Remove a borda lateral roxa que o navegador pode adicionar */
    border: 1px solid transparent !important;
}

/* **NOVO:** Estilo específico para quando o input de senha está focado e preenchido, para a borda roxa lateral */
.password-group input#password:focus {
    border-left: 3px solid #926EEB !important; /* Borda roxa de 3px no lado esquerdo */
    padding-left: 17px !important; /* Ajusta o padding para compensar a borda */
}
.password-group input#password:-webkit-autofill:focus {
    border-left: 3px solid #926EEB !important; /* Aplica também no autofill */
    padding-left: 17px !important;
    border-color: transparent !important;
}

.password-group .password-toggle {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: #A0A0A0; /* Cor do ícone no estado normal */
  display: flex;
  align-items: center;
  justify-content: center;
}

/* **NOVO:** Cor do ícone de olho quando o input está preenchido/focado */
.password-group .auth-input:not(:placeholder-shown) + .password-toggle, /* Quando o input tem valor */
.password-group .auth-input:focus + .password-toggle {
    color: #926EEB; /* Cor roxa, como na imagem */
}


.password-toggle svg {
    width: 20px;
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
  accent-color: #00E676;
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
  width: 100%; /* Ajuste para ter o mesmo espaçamento horizontal dos inputs */
  padding: 15px;
  background-color: #00E676;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1em;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.auth-button:hover {
  background-color: #00C853;
}

.auth-footer-text {
  margin-top: 30px;
  text-align: center;
  color: #A0A0A0;
  font-size: 0.9em;
}

.auth-link {
  color: #926EEB; /* **AJUSTADO:** Cor roxa para o link "Cadastre-se" */
  text-decoration: none;
  font-weight: bold;
  transition: color 0.2s ease;
}

.auth-link:hover {
  text-decoration: underline;
}

/* Responsividade básica */
@media (max-width: 768px) {
  .auth-page-container {
    flex-direction: column;
  }

  .auth-logo-column {
    display: none; /* Esconde a coluna do logo em telas menores */
  }

  .auth-form-column {
    flex: none;
    width: 100%;
  }

  .auth-form-wrapper {
    padding: 20px;
  }
}
</style>
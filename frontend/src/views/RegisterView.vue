<template>
  <div class="auth-page-container">
    <div class="auth-logo-column">

    </div>

    <div class="auth-form-column">
      <div class="auth-form-wrapper">
        <h2 class="auth-title">Cadastro</h2>
        <p class="auth-subtitle">Preencha os dados abaixo para começar.</p>
        <form @submit.prevent="handleRegister" class="auth-form">
          <div class="form-group">
            <input type="text" id="name" v-model="firstName" placeholder="Nome" required class="auth-input" />
          </div>
          <div class="form-group">
            <input type="email" id="email" v-model="email" placeholder="E-mail" required class="auth-input" />
          </div>
          <div class="form-group password-group">
            <input :type="passwordFieldType" id="password" v-model="password" placeholder="Senha" required class="auth-input" />
            <span class="password-toggle" @click="togglePasswordVisibility">
              <span v-if="passwordFieldType === 'password'">🙈</span>
              <span v-else>👁️</span>
            </span>
          </div>
          <div class="form-group password-group">
            <input :type="confirmPasswordFieldType" id="confirmPassword" v-model="confirmPassword" placeholder="Confirma Senha" required class="auth-input" />
            <span class="password-toggle" @click="toggleConfirmPasswordVisibility">
              <span v-if="confirmPasswordFieldType === 'password'">🙈</span>
              <span v-else>👁️</span>
            </span>
          </div>
          <button type="submit" class="auth-button">Concluir cadastro</button>
        </form>
        <p class="auth-footer-text">Já tem uma conta? <router-link to="/login" class="auth-link">Faça login</router-link></p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { supabase } from '../supabase';
import { useRouter } from 'vue-router';

const firstName = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const router = useRouter();
const passwordFieldType = ref('password');
const confirmPasswordFieldType = ref('password');

const togglePasswordVisibility = () => {
  passwordFieldType.value = passwordFieldType.value === 'password' ? 'text' : 'password';
};

const toggleConfirmPasswordVisibility = () => {
  confirmPasswordFieldType.value = confirmPasswordFieldType.value === 'password' ? 'text' : 'password';
};

const handleRegister = async () => {
  if (password.value !== confirmPassword.value) {
    alert('As senhas não coincidem!');
    return;
  }

  try {
    const { data, error } = await supabase.auth.signUp({ 
      email: email.value,
      password: password.value,
      options: {
        data: {
          first_name: firstName.value,
        },
      },
    });

    if (error) throw error;

    if (data.user) { 
      await supabase.auth.signOut();
    }

    router.push('/registration-success');
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
  overflow: hidden;
  background-color: #F8F8F8; /* Fundo claro para a coluna do formulário */
}

/* Coluna do logo (visualmente à esquerda) */
.auth-logo-column {
  flex: 1;
  background-color: #1A1A1A; /* Fundo escuro */
  display: flex;
  align-items: center;
  justify-content: center;
  order: 1; /* Força esta coluna a ser a primeira (esquerda) */
}

.logo {
  max-width: 80%;
  height: auto;
}

/* Coluna do formulário (visualmente à direita) */
.auth-form-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background-color: #F8F8F8;
  order: 2; /* Força esta coluna a ser a segunda (direita) */
}

.auth-form-wrapper {
  max-width: 380px;
  width: 100%;
  padding: 0 40px;
  box-sizing: border-box;
}

.auth-title {
  color: #333333;
  font-size: 2.2em;
  margin-bottom: 5px;
  text-align: left;
  font-weight: 600;
  margin-top: 0;
}

.auth-subtitle {
  color: #A0A0A0;
  font-size: 0.9em;
  margin-top: 0;
  margin-bottom: 25px;
  text-align: left;
}

.auth-form .form-group {
  margin-bottom: 20px;
  position: relative;
}

.auth-input {
  width: 100%;
  padding: 15px 20px;
  border: 1px solid transparent; /* Bordas transparentes por padrão */
  border-radius: 8px;
  background-color: white; /* Fundo BRANCO para inputs */
  font-size: 1em;
  color: #4A4A4A; /* Cor do texto padrão */
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s ease;
}

.auth-input:focus {
    border-color: #926EEB; /* Borda roxa ao focar */
}

.auth-input::placeholder {
  color: #A0A0A0;
}

/* ESTILOS PARA INPUTS PREENCHIDOS / AUTOFILL (MANTIDOS E APLICADOS A TODOS OS INPUTS) */
.auth-input:-webkit-autofill,
.auth-input:-webkit-autofill:hover,
.auth-input:-webkit-autofill:focus,
.auth-input:-webkit-autofill:active {
    -webkit-box-shadow: 0 0 0px 1000px white inset !important; /* Fundo branco */
    -webkit-text-fill-color: #4A4A4A !important; /* Texto cinza escuro */
    transition: background-color 50000s ease-in-out 0s !important; /* Transição imediata */
    border: 1px solid transparent !important; /* Remove borda extra */
}

/* Estilo específico para inputs de SENHA com borda roxa lateral no focus */
.password-group input[type="password"]:focus,
.password-group input[type="password"]:-webkit-autofill:focus {
    border-left: 3px solid #926EEB !important;
    padding-left: 17px !important;
    border-color: transparent !important; /* Ensure other borders are transparent */
}

.password-group .auth-input {
  padding-right: 50px; /* Make space for the toggle icon */
}

.password-group .password-toggle {
  position: absolute;
  right: 20px; /* Adjust this value to move the icon left/right */
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: #A0A0A0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2em; /* Ensure emoji size is consistent */
  line-height: 1; /* Helps with vertical alignment of emojis */
}

/* Cor do ícone de olho quando o input está preenchido/focado */
.password-group .auth-input:not(:placeholder-shown) + .password-toggle,
.password-group .auth-input:focus + .password-toggle {
    color: #926EEB;
}

/* Removed, as we're using emojis directly now */
/* .password-toggle svg {
    width: 20px;
    height: 20px;
} */

.auth-button {
  width: 100%;
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
  color: #926EEB;
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
    display: none;
  }

  .auth-form-column {
    flex: none;
    width: 100%;
  }

  .auth-form-wrapper {
    padding: 20px;
  }

  /* Adjust password toggle for smaller screens if needed */
  .password-group .password-toggle {
    right: 20px; /* Keep it consistent with padding */
  }
}
</style>
<template>
  <div class="min-h-screen w-screen flex flex-col md:flex-row overflow-hidden bg-gray-50">
    <div class="hidden md:flex flex-1 bg-[#1a1a1a] items-center justify-center">
      <img src="../assets/FinvyLogo.svg" alt="Logo" class="max-w-[30%] h-auto" />
    </div>

    <div class="flex flex-1 flex-col items-center justify-center p-5 bg-gray-50">
      <div class="max-w-sm w-full px-10 box-border">
        <h2 class="text-gray-800 text-3xl mb-1 text-left font-semibold mt-0">Cadastro</h2>
        <p class="text-gray-400 text-sm mt-0 mb-6 text-left">Preencha os dados abaixo para começar.</p>

        <form @submit.prevent="handleRegister" class="space-y-5">
          <div>
            <input
              type="text"
              id="name"
              v-model="firstName"
              placeholder="Nome"
              required
              class="w-full p-4 rounded-lg bg-white text-gray-700 placeholder-gray-400 outline-none
                     focus:border-l-4 focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all duration-200 ease-in-out focus-custom-padding"
            />
          </div>
          <div>
            <input
              type="email"
              id="email"
              v-model="email"
              placeholder="E-mail"
              required
              class="w-full p-4 rounded-lg bg-white text-gray-700 placeholder-gray-400 outline-none
                     focus:border-l-4 focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all duration-200 ease-in-out focus-custom-padding"
            />
          </div>
          <div class="relative">
            <input
              :type="passwordFieldType"
              id="password"
              v-model="password"
              placeholder="Senha"
              required
              class="w-full p-4 rounded-lg bg-white text-gray-700 placeholder-gray-400 outline-none pr-12
                     focus:border-l-4 focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all duration-200 ease-in-out focus-custom-padding"
            />
            <span
              class="absolute right-5 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 flex items-center justify-center text-lg"
              @click="togglePasswordVisibility"
              :class="{ 'text-purple-600': passwordFieldType === 'text' || password }"
            >
              <span v-if="passwordFieldType === 'password'">🙈</span>
              <span v-else>🙉</span>
            </span>
          </div>
          <div class="relative">
            <input
              :type="confirmPasswordFieldType"
              id="confirmPassword"
              v-model="confirmPassword"
              placeholder="Confirma Senha"
              required
              class="w-full p-4 rounded-lg bg-white text-gray-700 placeholder-gray-400 outline-none pr-12
                     focus:border-l-4 focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all duration-200 ease-in-out focus-custom-padding"
            />
            <span
              class="absolute right-5 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 flex items-center justify-center text-lg"
              @click="toggleConfirmPasswordVisibility"
              :class="{ 'text-purple-600': confirmPasswordFieldType === 'text' || confirmPassword }"
            >
              <span v-if="confirmPasswordFieldType === 'password'">🙈</span>
              <span v-else>🙉</span>
            </span>
          </div>
          <button type="submit" class="w-full p-4 bg-emerald-400 text-white font-bold rounded-lg cursor-pointer transition-colors duration-300 hover:bg-emerald-500">
            Concluir cadastro
          </button>
        </form>
        <p class="mt-8 text-center text-gray-400 text-sm">
          Já tem uma conta?
          <router-link to="/login" class="text-[#4169E1] no-underline font-bold transition-colors duration-200 hover:underline">
            Faça login
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const firstName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const passwordFieldType = ref('password')
const confirmPasswordFieldType = ref('password')

const togglePasswordVisibility = () => {
  passwordFieldType.value = passwordFieldType.value === 'password' ? 'text' : 'password'
}

const toggleConfirmPasswordVisibility = () => {
  confirmPasswordFieldType.value =
    confirmPasswordFieldType.value === 'password' ? 'text' : 'password'
}

const handleRegister = async () => {
  if (password.value !== confirmPassword.value) {
    alert('As senhas não coincidem!')
    return
  }

  const success = await authStore.signUp(email.value, password.value, firstName.value)

  if (success) {
    router.push('/registration-success')
  } else {
    alert(authStore.error || 'Ocorreu um erro desconhecido.')
  }
}
</script>

<style scoped>
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus,
input:-webkit-autofill:active {
  -webkit-box-shadow: 0 0 0px 1000px white inset !important;
  -webkit-text-fill-color: #1a1a1a !important;
  transition: background-color 50000s ease-in-out 0s !important;
  border-color: transparent !important;
}

input:focus,
input:-webkit-autofill:focus {
  border-left: 4px solid #1a1a1a !important;
  padding-left: calc(1rem - 1px) !important;
  box-shadow: 0 0 0px 1px #1a1a1a inset !important;
  outline: none !important;
}
</style>
<template>
  <div class="min-h-screen w-screen flex flex-col md:flex-row overflow-hidden bg-gray-50">
    <div class="hidden md:flex flex-1 bg-[#1a1a1a] items-center justify-center">
      <img src="../assets/FinvyLogo.svg" alt="Logo" class="max-w-[30%] h-auto" />
    </div>

    <div class="flex flex-1 flex-col items-center justify-center p-5 bg-gray-50">
      <div class="max-w-sm w-full px-10 box-border">
        <h2 class="text-gray-800 text-3xl mb-6 text-left font-semibold mt-0">Fazer login</h2>
        <form @submit.prevent="handleLogin" class="space-y-5">
          <div>
            <input
              type="email"
              id="email"
              v-model="email"
              placeholder="E-mail"
              required
              class="w-full p-4 border border-transparent rounded-lg bg-white text-gray-700 placeholder-gray-400 outline-none focus:border-l-4 focus:border-[#1a1a1a] transition-all duration-200 ease-in-out focus:pl-[calc(1rem-1px)]"
            />
          </div>
          <div class="relative">
            <input
              :type="passwordFieldType"
              id="password"
              v-model="password"
              placeholder="Senha"
              required
              class="w-full p-4 border border-transparent rounded-lg bg-white text-gray-700 placeholder-gray-400 outline-none focus:border-l-4 focus:border-[#1a1a1a] transition-all duration-200 ease-in-out focus:pl-[calc(1rem-1px)]"
            />
            <span class="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 flex items-center justify-center"
              @click="togglePasswordVisibility"
              :class="{ 'text-purple-600': passwordFieldType === 'text' || password }"
            >
              <span v-if="passwordFieldType === 'password'">🙈</span>
              <span v-else>🙉</span>
            </span>
          </div>
          <div class="flex justify-between items-center text-sm">
            <label class="flex items-center text-gray-400">
              <input type="checkbox" class="mr-2 w-4 h-4 accent-[#00e676]" />
              Lembrar-me
            </label>
            <router-link to="/forgot-password" class="text-gray-400 no-underline transition-colors duration-200 hover:text-[#00e676]"
              >Esqueci minha senha</router-link
            >
          </div>
          <button type="submit" class="w-full p-4 bg-[#00e676] text-white font-bold rounded-lg cursor-pointer transition-colors duration-300 hover:bg-[#00c853]">
            Entrar
          </button>
        </form>
        <p class="mt-8 text-center text-gray-400 text-sm">
          Não tem uma conta?
          <router-link to="/register" class="text-[#4169E1] no-underline font-bold transition-colors duration-200 hover:underline">
            Cadastre-se
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { supabase } from '../supabase'
import { useRouter } from 'vue-router'

const email = ref('')
const password = ref('')
const router = useRouter()
const passwordFieldType = ref('password')

const togglePasswordVisibility = () => {
  passwordFieldType.value = passwordFieldType.value === 'password' ? 'text' : 'password'
}

const handleLogin = async () => {
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value
    })

    if (error) throw error
    router.push('/')
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
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus,
input:-webkit-autofill:active {
  -webkit-box-shadow: 0 0 0px 1000px white inset !important;
  -webkit-text-fill-color: #4a4a4a !important;
  transition: background-color 50000s ease-in-out 0s !important;
}

input:focus,
input:-webkit-autofill:focus {
  border-left: 4px solid #1a1a1a !important;
  padding-left: calc(1rem - 1px) !important;
  outline: none !important;
}
</style>
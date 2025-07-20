<template>
  <div class="min-h-screen w-screen flex flex-col md:flex-row overflow-hidden bg-gray-50">
    <div class="flex flex-1 flex-col items-center justify-center p-5 bg-gray-50 order-1 relative">
      <div class="absolute top-10 left-10 z-10">
        <router-link
          to="/login"
          class="flex items-center justify-center w-10 h-10 rounded-full bg-transparent border border-gray-200 cursor-pointer text-gray-600 transition-colors duration-200 hover:bg-gray-100 no-underline"
        >
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

      <div class="max-w-sm w-full px-10 box-border md:p-10">
        <h2 class="text-gray-800 text-3xl font-semibold mb-2 text-left">
          Eita, esqueceu sua senha?
        </h2>
        <p class="text-gray-400 text-sm mb-8 text-left">Não esquenta, vamos dar um jeito nisso.</p>

        <form @submit.prevent="handleForgotPassword" class="space-y-5">
          <div class="relative bg-white rounded-lg shadow-sm overflow-hidden">
            <input
              type="email"
              id="email"
              v-model="email"
              placeholder="E-mail"
              required
              class="w-full p-4 border border-transparent rounded-lg bg-transparent text-gray-700 placeholder-gray-400 outline-none focus:border-l-4 focus:border-[#1a1a1a] transition-all duration-200 ease-in-out focus:pl-[calc(1rem-1px)]"
            />
          </div>
          <button
            type="submit"
            class="w-full p-4 bg-emerald-400 text-white font-bold rounded-lg cursor-pointer transition-colors duration-300 hover:bg-emerald-500 disabled:bg-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed"
            :disabled="!email"
          >
            Enviar
          </button>
        </form>
      </div>
    </div>

    <div class="hidden md:flex flex-1 bg-[#1a1a1a] items-center justify-center order-2">
      <img src="../../assets/FinvyLogo.svg" alt="Logo" class="max-w-[30%] h-auto" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { supabase } from '../../supabase'
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

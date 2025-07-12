<template>
  <div class="min-h-screen w-screen flex items-center justify-center bg-[#1a1a1a] text-white text-center overflow-hidden p-4">
    <div class="flex flex-col items-center p-10 max-w-lg">
      <div class="w-24 h-24 flex items-center justify-center mb-8">
        <img src="../assets/check-success.svg" alt="ícone de sucesso" />
      </div>
      <h1 class="text-4xl font-bold mb-4 text-white">Redefinição enviada!</h1>
      <p class="text-lg text-gray-400 mb-10 leading-relaxed">
        Boa, agora é só checar o e-mail que foi enviado para você redefinir sua senha e aproveitar
        os estudos.
      </p>
      <button @click="goToLogin" class="px-8 py-4 bg-emerald-400 text-white font-bold rounded-lg cursor-pointer transition-colors duration-300 hover:bg-emerald-500">
        Voltar ao login
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goToLogin = () => {
  router.push('/login')
}
</script>
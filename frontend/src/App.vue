<script setup lang="ts">
import { RouterLink, RouterView, useRouter, useRoute } from 'vue-router'
import { ref, computed } from 'vue'
import { supabase } from './supabase'
import Toast from 'primevue/toast'
import type { Session } from '@supabase/supabase-js'

const router = useRouter()
const route = useRoute()

const session = ref<Session | null>(null)

supabase.auth.getSession().then(({ data }) => {
  session.value = data.session
})

supabase.auth.onAuthStateChange((_, _session) => {
  session.value = _session
})

const handleLogout = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    router.push('/login')
  } catch (error: unknown) {
    if (error instanceof Error) {
      alert(error.message)
    }
  }
}

const shouldHideNavbar = computed(() => {
  return route.meta.hideNavbar || false
})
</script>

<template>
  <Toast />

  <div v-if="session && !shouldHideNavbar" class="min-h-screen bg-gray-100">
    <header class="bg-gray-100 py-4 px-6 grid items-center sticky top-0 z-50" style="grid-template-columns: 180px 1fr auto;">
      <div class="flex items-center">
        <img src="./assets/FinvyLogoBlack.svg" alt="Finvy Logo" class="h-16 w-16" />
      </div>

      <nav class="flex justify-start space-x-6 whitespace-nowrap">
        <RouterLink to="/"
          class="text-gray-600 hover:text-gray-900 font-medium router-link-active:text-blue-600">Home</RouterLink>
        <RouterLink to="/accounts"
          class="text-gray-600 hover:text-gray-900 font-medium whitespace-nowrap router-link-active:text-blue-600">Plano de
          Contas</RouterLink>
        <RouterLink to="/journal-entries"
          class="text-gray-600 hover:text-gray-900 font-medium whitespace-nowrap router-link-active:text-blue-600">Lançamentos Contábeis</RouterLink>
        <RouterLink to="/products"
          class="text-gray-600 hover:text-gray-900 font-medium whitespace-nowrap router-link-active:text-blue-600">Produtos</RouterLink>
        <RouterLink to="/stock-control"
          class="text-gray-600 hover:text-gray-900 font-medium whitespace-nowrap router-link-active:text-blue-600">Controle de Estoque</RouterLink>
        <RouterLink to="/ledger"
          class="text-gray-600 hover:text-gray-900 font-medium router-link-active:text-blue-600">Razão</RouterLink>
        <RouterLink to="/reports"
          class="text-gray-600 hover:text-gray-900 font-medium router-link-active:text-blue-600">Relatórios</RouterLink>
      </nav>

      <div class="flex justify-end items-center space-x-4">
        <div class="relative">
          <input type="text" placeholder="Faça uma busca"
            class="rounded-full bg-gray-100 px-4 py-2 text-sm w-64 outline-none focus:ring-2 focus:ring-gray-300" />
          <svg class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor"
            viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <button class="p-2 rounded-full hover:bg-gray-200 relative">
          <i class="pi pi-bell text-xl text-gray-600"></i>
        </button>

        <img src="./assets/LogoIcon.svg" alt="User Avatar" class="h-8 w-8 rounded-full cursor-pointer" @click="handleLogout" />
      </div>
    </header>

    <main class="p-6">
      <RouterView />
    </main>
  </div>

  <div v-else>
    <RouterView />
  </div>
</template>
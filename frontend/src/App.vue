<script setup lang="ts">
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import Toast from 'primevue/toast'
import UserMenu from '@/components/UserMenu.vue'

import FinvyLogo from './assets/FinvyLogo.svg'
import FinvyLogoBlack from './assets/FinvyLogoBlack.svg'

const route = useRoute()
const authStore = useAuthStore()
const themeStore = useThemeStore()

const showUserMenu = ref(false)

const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value
}

const closeUserMenu = () => {
  showUserMenu.value = false
}

onMounted(() => {
  authStore.initAuthListener()
  window.addEventListener('click', closeUserMenu)
})

onUnmounted(() => {
  window.removeEventListener('click', closeUserMenu)
})

const shouldHideNavbar = computed(() => {
  return route.meta.hideNavbar || false
})

const logoSrc = computed(() => {
  return themeStore.theme === 'dark' ? FinvyLogo : FinvyLogoBlack
})
</script>

<template>
  <Toast aria-live="polite" />

  <div v-if="authStore.isLoggedIn && !shouldHideNavbar" class="min-h-screen bg-surface-100">
        <header class="navbar-background py-4 px-6 grid items-center sticky top-0 z-50" style="grid-template-columns: 180px 1fr auto;">
      <div class="flex items-center">
        <img :src="logoSrc" alt="Finvy Logo" class="h-16 w-16" />
      </div>

      <nav class="flex justify-start space-x-6 whitespace-nowrap">
        <RouterLink to="/"
          class="text-surface-600 hover:text-surface-900 font-medium router-link-active:text-blue-600">Home</RouterLink>
        <RouterLink to="/accounts"
          class="text-surface-600 hover:text-surface-900 font-medium whitespace-nowrap router-link-active:text-blue-600">Plano de
          Contas</RouterLink>
        <RouterLink to="/journal-entries"
          class="text-surface-600 hover:text-surface-900 font-medium whitespace-nowrap router-link-active:text-blue-600">Lançamentos Contábeis</RouterLink>
        <RouterLink to="/products"
          class="text-surface-600 hover:text-surface-900 font-medium whitespace-nowrap router-link-active:text-blue-600">Produtos</RouterLink>
        <RouterLink to="/stock-control"
          class="text-surface-600 hover:text-surface-900 font-medium whitespace-nowrap router-link-active:text-blue-600">Controle de Estoque</RouterLink>
        <RouterLink to="/ledger"
          class="text-surface-600 hover:text-surface-900 font-medium router-link-active:text-blue-600">Razão</RouterLink>
        <RouterLink to="/reports"
          class="text-surface-600 hover:text-surface-900 font-medium router-link-active:text-blue-600">Relatórios</RouterLink>
      </nav>

      <div class="flex justify-end items-center space-x-4">
        <div class="relative">
          <label for="search-input" class="sr-only">Faça uma busca</label>
          <input type="text" id="search-input" placeholder="Faça uma busca"
            class="rounded-full bg-surface-100 px-4 py-2 text-sm w-64 outline-none focus:ring-2 focus:ring-primary-500" aria-label="Campo de busca" />
          <svg class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" fill="none" stroke="currentColor"
            viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <button class="p-2 rounded-full hover:bg-surface-200 relative" aria-label="Notificações">
          <i class="pi pi-bell text-xl text-surface-600"></i>
        </button>

        <div class="relative">
          <button type="button" class="rounded-full cursor-pointer" @click.stop="toggleUserMenu" aria-label="Menu do usuário">
            <img :src="authStore.avatarUrl || './assets/LogoIcon.svg'" alt="Avatar do usuário" class="h-8 w-8 rounded-full" />
          </button>
          <UserMenu v-if="showUserMenu" @close="closeUserMenu" />
        </div>
      </div>
    </header>

    <main class="p-8">
      <RouterView />
    </main>
  </div>

  <div v-else>
    <RouterView />
  </div>
</template>
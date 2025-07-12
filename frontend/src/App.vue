'''<script setup lang="ts">
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import { useAccountingPeriodStore } from '@/stores/accountingPeriodStore'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import { setToast } from '@/services/notificationService'
import UserMenu from '@/components/UserMenu.vue'

import FinvyLogo from './assets/FinvyLogo.svg'
import FinvyLogoBlack from './assets/FinvyLogoBlack.svg'

const route = useRoute()
const authStore = useAuthStore()
const themeStore = useThemeStore()
const accountingPeriodStore = useAccountingPeriodStore()
const toast = useToast()

const showUserMenu = ref(false)

const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value
}

const closeUserMenu = () => {
  showUserMenu.value = false
}

onMounted(() => {
  setToast(toast)
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
</script>'''

<template>
  <Toast aria-live="polite" />

  <div v-if="authStore.isLoggedIn && !shouldHideNavbar" class="min-h-screen bg-surface-100">
    <header
      class="navbar-background py-4 px-6 grid items-center sticky top-0 z-50 bg-surface-100"
      style="grid-template-columns: 180px 1fr auto"
    >
      <div class="flex items-center">
        <img :src="logoSrc" alt="Finvy Logo" class="h-16 w-16" />
      </div>

      <nav class="flex justify-start space-x-6 whitespace-nowrap">
        <RouterLink
          to="/"
          class="text-surface-600 hover:text-surface-900 font-medium router-link-active:text-blue-600"
          >Home</RouterLink
        >
        <RouterLink
          to="/accounts"
          class="text-surface-600 hover:text-surface-900 font-medium whitespace-nowrap router-link-active:text-blue-600"
          >Plano de Contas</RouterLink
        >
        <RouterLink
          to="/journal-entries"
          class="text-surface-600 hover:text-surface-900 font-medium whitespace-nowrap router-link-active:text-blue-600"
          >Lançamentos Contábeis</RouterLink
        >
        <RouterLink
          to="/products"
          class="text-surface-600 hover:text-surface-900 font-medium whitespace-nowrap router-link-active:text-blue-600"
          >Produtos</RouterLink
        >
        <RouterLink
          to="/stock-control"
          class="text-surface-600 hover:text-surface-900 font-medium whitespace-nowrap router-link-active:text-blue-600"
          >Controle de Estoque</RouterLink
        >
        <RouterLink
          to="/ledger"
          class="text-surface-600 hover:text-surface-900 font-medium router-link-active:text-blue-600"
          >Razão</RouterLink
        >
        <RouterLink
          to="/reports"
          class="text-surface-600 hover:text-surface-900 font-medium router-link-active:text-blue-600"
          >Relatórios</RouterLink
        >
      </nav>

      <div class="flex justify-end items-center space-x-4">
        <router-link
          to="/accounting-periods"
          v-if="accountingPeriodStore.activeAccountingPeriod"
          class="flex items-center space-x-2 px-3 py-1 text-sm font-medium text-surface-700 bg-surface-200 rounded-full shadow-inner cursor-pointer hover:bg-surface-300 transition-colors duration-200"
        >
          <div class="w-3 h-3 bg-green-500 rounded-full" title="Período Ativo"></div>
          <span>{{ accountingPeriodStore.activeAccountingPeriod.name }}</span>
        </router-link>

        <button class="p-2 rounded-full hover:bg-surface-200 relative" aria-label="Notificações">
          <i class="pi pi-bell text-xl text-surface-600"></i>
        </button>

        <div class="relative">
          <button
            type="button"
            class="rounded-full cursor-pointer"
            @click.stop="toggleUserMenu"
            aria-label="Menu do usuário"
          >
            <img
              :src="authStore.avatarUrl ?? undefined"
              alt="Avatar do usuário"
              class="h-8 w-8 rounded-full"
            />
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

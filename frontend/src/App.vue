'''
<script setup lang="ts">
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import { useAccountingPeriodStore } from '@/stores/accountingPeriodStore'
import { useUserPresenceStore } from '@/stores/userPresenceStore'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import { setToast } from '@/services/notificationService'
import UserMenu from '@/components/UserMenu.vue'
import ChatbotWindow from '@/components/ChatbotWindow.vue'
import UserAvatarWithPresence from '@/components/UserAvatarWithPresence.vue'
import { useGlobalChatbotStore } from '@/stores/globalChatbotStore'


import FinvyLogo from './assets/FinvyLogo.svg'
import FinvyLogoBlack from './assets/FinvyLogoBlack.svg'

const route = useRoute()

const authStore = useAuthStore()
const themeStore = useThemeStore()
const accountingPeriodStore = useAccountingPeriodStore()
const toast = useToast()
const globalChatbotStore = useGlobalChatbotStore()
const userPresenceStore = useUserPresenceStore()

const showUserMenu = ref(false)
const isMobileMenuOpen = ref(false)
const isChatbotMaximized = ref(false)

const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value
}

const closeUserMenu = () => {
  showUserMenu.value = false
}

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}

const toggleChatbotMaximize = () => {
  isChatbotMaximized.value = !isChatbotMaximized.value
}

onMounted(() => {
  setToast(toast);
  authStore.initAuthListener();
  userPresenceStore.startPresenceTracking();
  window.addEventListener('click', closeUserMenu);
});

onUnmounted(() => {
  window.removeEventListener('click', closeUserMenu);
  userPresenceStore.stopPresenceTracking();
});

const shouldHideNavbar = computed(() => {
  return route.meta.hideNavbar || false
})

const logoSrc = computed(() => {
  return themeStore.theme === 'dark' ? FinvyLogo : FinvyLogoBlack
})
</script>
'''

<template>
  <Toast aria-live="polite" />

  <div v-if="authStore.isLoggedIn && !shouldHideNavbar" class="min-h-screen bg-surface-100">
    <!-- Desktop Header (hidden on small screens) -->
    <header
      class="navbar-background py-4 px-6 grid items-center sticky top-0 z-50 bg-surface-100 hidden lg:grid"
      style="grid-template-columns: 180px 1fr auto"
    >
      <div class="flex items-center">
        <img :src="logoSrc" alt="Finvy Logo" class="h-16 w-16" />
      </div>

      <nav class="flex justify-start space-x-6 whitespace-nowrap">
        <RouterLink
          to="/dashboard"
          class="text-surface-600 hover:text-surface-900 font-medium router-link-active:text-blue-600 text-sm xl:text-base"
          >Home</RouterLink
        >
        <RouterLink
          to="/accounts"
          class="text-surface-600 hover:text-surface-900 font-medium whitespace-nowrap router-link-active:text-blue-600 text-sm xl:text-base"
          >Plano de Contas</RouterLink
        >
        <RouterLink
          to="/journal-entries"
          class="text-surface-600 hover:text-surface-900 font-medium whitespace-nowrap router-link-active:text-blue-600 text-sm xl:text-base"
          >Lançamentos Contábeis</RouterLink
        >
        <RouterLink
          to="/products"
          class="text-surface-600 hover:text-surface-900 font-medium whitespace-nowrap router-link-active:text-blue-600 text-sm xl:text-base"
          >Produtos</RouterLink
        >
        <RouterLink
          to="/stock-control"
          class="text-surface-600 hover:text-surface-900 font-medium whitespace-nowrap router-link-active:text-blue-600 text-sm xl:text-base"
          >Controle de Estoque</RouterLink
        >
        <RouterLink
          to="/ledger"
          class="text-surface-600 hover:text-surface-900 font-medium router-link-active:text-blue-600 text-sm xl:text-base"
          >Razão</RouterLink
        >
        <RouterLink
          to="/reports"
          class="text-surface-600 hover:text-surface-900 font-medium router-link-active:text-blue-600 text-sm xl:text-base"
          >Relatórios</RouterLink
        >
      </nav>

      <div class="flex justify-end items-center space-x-4">

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
              class="w-9 rounded-full"
            />

          </button>
          <UserMenu v-if="showUserMenu" @close="closeUserMenu" />
        </div>
      </div>
    </header>

    <!-- Mobile Header (visible on small screens) -->
    <header
      v-if="authStore.isLoggedIn && !shouldHideNavbar"
      class="flex items-center justify-between p-4 bg-surface-100 shadow-md sticky top-0 z-50 lg:hidden"
    >
      <button
        @click="toggleMobileMenu"
        class="text-surface-600 focus:outline-none mobile-menu-toggle"
      >
        <i class="pi pi-bars text-2xl"></i>
      </button>
      <div class="flex items-center space-x-2">
        <div class="flex items-center space-x-2">
          <UserAvatarWithPresence
            v-for="user in userPresenceStore.onlineUsers"
            :key="user.user_id"
            :user="user"
            :currentUserId="authStore.user?.id"
            class="h-6 w-6"
          />
        </div>

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
              class="w-9 rounded-full"
            />
          </button>
          <UserMenu v-if="showUserMenu" @close="closeUserMenu" />
        </div>
      </div>
    </header>

    <!-- Mobile Menu Overlay -->
    <div
      v-if="isMobileMenuOpen"
      class="fixed inset-0 bg-black bg-opacity-50 z-40"
      @click="closeMobileMenu"
    ></div>

    <!-- Mobile Side Menu -->
    <div
      :class="{ 'translate-x-0': isMobileMenuOpen, '-translate-x-full': !isMobileMenuOpen }"
      class="fixed top-0 left-0 w-64 h-full bg-surface-900 text-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out lg:hidden mobile-side-menu"
    >
      <div class="p-4 border-b border-surface-700 flex items-center justify-between">
        <img :src="FinvyLogo" alt="Finvy Logo" class="h-10 w-10" />
        <button
          @click="closeMobileMenu"
          class="text-surface-400 hover:text-white focus:outline-none"
        >
          <i class="pi pi-times text-xl"></i>
        </button>
      </div>

      <nav class="flex flex-col p-4 space-y-2">
        <RouterLink
          to="/dashboard"
          class="flex items-center px-3 py-2 rounded-md text-surface-300 hover:bg-surface-700 transition-colors duration-200"
          @click="closeMobileMenu"
        >
          <i class="pi pi-home mr-3"></i>
          Home
        </RouterLink>
        <RouterLink
          to="/accounts"
          class="flex items-center px-3 py-2 rounded-md text-surface-300 hover:bg-surface-700 transition-colors duration-200"
          @click="closeMobileMenu"
        >
          <i class="pi pi-book mr-3"></i>
          Plano de Contas
        </RouterLink>
        <RouterLink
          to="/journal-entries"
          class="flex items-center px-3 py-2 rounded-md text-surface-300 hover:bg-surface-700 transition-colors duration-200"
          @click="closeMobileMenu"
        >
          <i class="pi pi-pencil mr-3"></i>
          Lançamentos Contábeis
        </RouterLink>
        <RouterLink
          to="/products"
          class="flex items-center px-3 py-2 rounded-md text-surface-300 hover:bg-surface-700 transition-colors duration-200"
          @click="closeMobileMenu"
        >
          <i class="pi pi-box mr-3"></i>
          Produtos
        </RouterLink>
        <RouterLink
          to="/stock-control"
          class="flex items-center px-3 py-2 rounded-md text-surface-300 hover:bg-surface-700 transition-colors duration-200"
          @click="closeMobileMenu"
        >
          <i class="pi pi-chart-bar mr-3"></i>
          Controle de Estoque
        </RouterLink>
        <RouterLink
          to="/ledger"
          class="flex items-center px-3 py-2 rounded-md text-surface-300 hover:bg-surface-700 transition-colors duration-200"
          @click="closeMobileMenu"
        >
          <i class="pi pi-list mr-3"></i>
          Razão
        </RouterLink>
        <RouterLink
          to="/reports"
          class="flex items-center px-3 py-2 rounded-md text-surface-300 hover:bg-surface-700 transition-colors duration-200"
          @click="closeMobileMenu"
        >
          <i class="pi pi-file-excel mr-3"></i>
          Relatórios
        </RouterLink>
      </nav>
    </div>

    <div class="relative flex">
      <main class="flex-grow p-8">
        <RouterView />
      </main>

      <div
        v-if="globalChatbotStore.isChatbotModalVisible"
        :class="{
          'fixed bottom-24 right-4 w-96 h-[75vh]': !isChatbotMaximized,
          'fixed bottom-24  right-4 w-165 h-[87vh]': isChatbotMaximized
        }"
        class="bg-surface-100 shadow-lg rounded-[1rem] border border-surface-200 flex flex-col z-50 overflow-hidden transition-all duration-300 ease-in-out">
        <div
          class="flex items-center justify-between p-4 border-b border-surface-200 bg-surface-50 text-surface-900">
          <div class="flex items-center space-x-2">
            <img :src="logoSrc" alt="Finvy Logo" class="h-9 w-9" />
            <span class="text-sm font-semibold">Assistente</span>
          </div>
          <div class="flex items-center space-x-2">
            <button @click="toggleChatbotMaximize" class="text-surface-600 hover:text-surface-900">
              <i class="material-icons" style="font-size: 15px !important;" >{{ isChatbotMaximized ? 'close_fullscreen' : 'open_in_full' }}</i>
            </button>
          </div>
        </div>

        <ChatbotWindow />
      </div>
    </div>


    <!-- Floating Chatbot Button -->

    <button
      class="fixed bottom-4 right-4 bg-surface-900 text-surface-50 p-3 rounded-[30vh] shadow-lg"
      aria-label="Abrir Chatbot"
      @click="globalChatbotStore.toggleChatbotModal()"
    >
      <span class="material-icons" style="font-size: 20px !important;">{{
        globalChatbotStore.isChatbotModalVisible ? 'south_east' : 'chat_bubble'
      }}</span>
    </button>
  </div>

  <div v-else>
    <RouterView />
  </div>
</template>
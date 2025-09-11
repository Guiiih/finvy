<script setup lang="ts">
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import { useAccountingPeriodStore } from '@/stores/accountingPeriodStore'
import { useUserPresenceStore } from '@/stores/userPresenceStore'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import { setToast } from '@/services/notificationService'
import UserMenu from '@/components/UserMenu.vue'
import MobileUserMenu from '@/components/MobileUserMenu.vue'
import ChatbotWindow from '@/components/ChatbotWindow.vue'
import UserAvatarWithPresence from '@/components/UserAvatarWithPresence.vue'
import { useGlobalChatbotStore } from '@/stores/globalChatbotStore'
import FinvyLogo from './assets/FinvyLogo.svg'
import FinvyLogoBlack from './assets/FinvyLogoBlack.svg'
import BottomNavBar from '@/components/BottomNavBar.vue'
import MobileMoreMenu from '@/components/MobileMoreMenu.vue'

const route = useRoute()

const authStore = useAuthStore()
const themeStore = useThemeStore()
const accountingPeriodStore = useAccountingPeriodStore()
const toast = useToast()
const globalChatbotStore = useGlobalChatbotStore()
const userPresenceStore = useUserPresenceStore()

const showUserMenu = ref(false)

const isChatbotMaximized = ref(false)
const isMoreMenuOpen = ref(false)

const toggleChatbotMaximize = () => {
  isChatbotMaximized.value = !isChatbotMaximized.value
}

const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value
}

const closeUserMenu = () => {
  showUserMenu.value = false
}

onMounted(() => {
  setToast(toast)
  authStore.initAuthListener()

  watch(
    () => authStore.profileLoaded,
    (isLoaded) => {
      if (isLoaded) {
        userPresenceStore.startPresenceTracking()
      } else {
        userPresenceStore.stopPresenceTracking()
      }
    },
    { immediate: true },
  )
})

onUnmounted(() => {
  userPresenceStore.stopPresenceTracking()
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
          <span>{{ accountingPeriodStore.activeAccountingPeriod.fiscal_year }}</span>
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
            <img :src="authStore.avatarUrl ?? undefined" alt="Avatar" class="w-9 rounded-full" />
          </button>
          <UserMenu v-if="showUserMenu" @close="closeUserMenu" class="hidden lg:block" />
          <MobileUserMenu v-model:visible="showUserMenu" class="lg:hidden" />
        </div>
      </div>
    </header>

    <!-- Mobile Header (visible on small screens) -->
    <header
      v-if="authStore.isLoggedIn && !shouldHideNavbar"
      class="flex items-center justify-between p-4 bg-surface-100 sticky top-0 z-50 lg:hidden"
    >
      <img :src="logoSrc" alt="Finvy Logo" class="h-10 w-10" />

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
          <span>{{ accountingPeriodStore.activeAccountingPeriod.fiscal_year }}</span>
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
              alt="Avatar"
              class="w-9 h-9 rounded-full"
            />
          </button>
          <UserMenu v-if="showUserMenu" @close="closeUserMenu" class="hidden lg:block" />
          <MobileUserMenu v-model:visible="showUserMenu" class="lg:hidden" />
        </div>
      </div>
    </header>

    <MobileMoreMenu v-model:visible="isMoreMenuOpen" />

    <div class="relative flex">
      <main class="flex-grow p-2 px-6 pb-24 lg:pb-6 rounded-2xl">
        <RouterView />
      </main>

      <div
        v-if="globalChatbotStore.isChatbotModalVisible"
        :class="{
          'fixed bottom-24 right-4 w-96 h-[75vh]': !isChatbotMaximized,
          'fixed bottom-24  right-4 w-165 h-[87vh]': isChatbotMaximized,
        }"
        class="bg-surface-100 shadow-lg rounded-[1rem] border border-surface-200 flex flex-col z-50 overflow-hidden transition-all duration-300 ease-in-out"
      >
        <div
          class="flex items-center justify-between p-4 border-b border-surface-200 bg-surface-50 text-surface-900"
        >
          <div class="flex items-center space-x-2">
            <img :src="logoSrc" alt="Finvy Logo" class="h-9 w-9" />
            <span class="text-sm font-semibold">Assistente</span>
          </div>
          <div class="flex items-center space-x-2">
            <button
              @click="globalChatbotStore.toggleChatbotModal()"
              class="text-surface-600 hover:text-surface-900 lg:hidden"
            >
              <i class="material-icons" style="font-size: 15px !important">close</i>
            </button>
            <button
              @click="toggleChatbotMaximize"
              class="text-surface-600 hover:text-surface-900 hidden lg:block"
            >
              <i class="material-icons" style="font-size: 15px !important">{{
                isChatbotMaximized ? 'close_fullscreen' : 'open_in_full'
              }}</i>
            </button>
          </div>
        </div>

        <ChatbotWindow />
      </div>
    </div>

    <!-- Floating Chatbot Button -->

    <button
      class="fixed bottom-4 right-4 bg-surface-900 text-surface-50 p-3 rounded-[30vh] shadow-lg hidden lg:block"
      aria-label="Abrir Chatbot"
      @click="globalChatbotStore.toggleChatbotModal()"
    >
      <span class="material-icons" style="font-size: 20px !important">{{
        globalChatbotStore.isChatbotModalVisible ? 'south_east' : 'chat_bubble'
      }}</span>
    </button>

    <BottomNavBar
      v-if="!showUserMenu"
      @toggleMobileMenu="isMoreMenuOpen = !isMoreMenuOpen"
      @toggleUserMenu="showUserMenu = !showUserMenu"
    />
  </div>
  <div v-else>
    <RouterView />
  </div>
</template>

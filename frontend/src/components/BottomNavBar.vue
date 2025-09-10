<script setup lang="ts">
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useGlobalChatbotStore } from '@/stores/globalChatbotStore'
import { useAuthStore } from '@/stores/authStore'

interface NavItem {
  to?: string;
  icon: string;
  label: string;
  type: 'link' | 'notification' | 'mobileMenu' | 'chatbot' | 'profile';
}

const globalChatbotStore = useGlobalChatbotStore()
const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

const emit = defineEmits(['toggleMobileMenu', 'toggleUserMenu'])

const navItems: NavItem[] = [
  { icon: 'pi pi-th-large', label: 'Menu', type: 'mobileMenu' },
  { icon: 'pi pi-bell', label: 'Notificações', type: 'notification' },
  { to: '/dashboard', icon: 'pi-home', label: 'Home', type: 'link' },
  { icon: 'pi pi-comment', label: 'Chatbot', type: 'chatbot' },
  { icon: '', label: 'Perfil', type: 'profile' },
]

const isChatbotActive = () => {
  return globalChatbotStore.isChatbotModalVisible
}

const isProfileActive = () => {
  // Assuming profile is active if user menu is open, or if on profile route
  return route.path.startsWith('/profile') // Adjust as per actual profile route
}

const isNotificationActive = () => {
  // Implement logic for active notification state if applicable
  return false
}

const isMobileMenuActive = () => {
  // Implement logic for active mobile menu state if applicable
  return false
}

const getIconClass = (item: NavItem, isActive: boolean) => {
  const activeClass = 'bg-surface-50 text-surface-900 p-3 rounded-full'

  if (item.type === 'link') {
    return [item.icon, isActive ? activeClass : '']
  } else if (item.type === 'chatbot') {
    return [item.icon, isChatbotActive() ? activeClass : '']
  } else if (item.type === 'profile') {
    return [item.icon, isProfileActive() ? activeClass : '']
  } else if (item.type === 'notification') {
    return [item.icon, isNotificationActive() ? activeClass : '']
  } else if (item.type === 'mobileMenu') {
    return [item.icon, isMobileMenuActive() ? activeClass : '']
  }
  return [item.icon]
}

const handleClick = (item: NavItem) => {
  if (item.type === 'chatbot') {
    globalChatbotStore.toggleChatbotModal()
  } else if (item.type === 'mobileMenu') {
    emit('toggleMobileMenu')
  } else if (item.type === 'profile') {
    router.push('/settings')
  }
  // Notification button might have its own logic or just be visual
}
</script>

<template>
  <div class="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-6 pb-4">
    <nav
      class="bg-surface-900/70 backdrop-blur-md text-surface-100 rounded-full shadow-lg border border-surface-700/50"
    >
      <div class="flex justify-around items-center h-16">
        <template v-for="item in navItems" :key="item.label">
          <RouterLink
            v-if="item.type === 'link'"
            :to="item.to!"
            :aria-label="item.label"
            :title="item.label"
            class="flex flex-1 items-center justify-center transition-colors duration-200 text-surface-400"
            v-slot="{ isActive }"
          >
            <i class="pi" :class="getIconClass(item, isActive)"></i>
          </RouterLink>
          <button
            v-else
            @click="handleClick(item)"
            :aria-label="item.label"
            :title="item.label"
            class="flex flex-1 items-center justify-center transition-colors duration-200 text-surface-400"
          >
            <img
              v-if="item.type === 'profile'"
              :src="authStore.avatarUrl ?? undefined"
              alt="Avatar"
              class="w-9 h-9 rounded-full"
              :class="isProfileActive() ? 'border-2 border-surface-50' : ''"
            />
            <i v-else :class="getIconClass(item, false)"></i>
          </button>
        </template>
      </div>
    </nav>
  </div>
</template>

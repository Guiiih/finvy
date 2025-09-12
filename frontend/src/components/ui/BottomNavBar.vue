<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'

interface NavItem {
  to?: string
  icon: string
  label: string
  type: 'link' | 'mobileMenu' | 'chatbot'
}

const route = useRoute()

const emit = defineEmits(['toggleMobileMenu', 'toggleUserMenu'])

const navItems: NavItem[] = [
  { icon: '', label: 'Menu', type: 'mobileMenu' },
  { to: '/dashboard', icon: '', label: 'Home', type: 'link' },
  { to: '/chatbot', icon: '', label: 'Chatbot', type: 'link' },
]

const isChatbotActive = () => {
  return route.path === '/chatbot'
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
  } else if (item.type === 'mobileMenu') {
    return [item.icon, isMobileMenuActive() ? activeClass : '']
  }
  return [item.icon]
}

const handleClick = (item: NavItem) => {
  if (item.type === 'mobileMenu') {
    emit('toggleMobileMenu')
  }
}
</script>

<template>
  <div class="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-6 pb-4">
    <nav
      class="bg-surface-900/20 backdrop-blur-xl text-surface-100 rounded-full shadow-lg border border-surface-700/20"
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
            <div v-if="item.label === 'Home'" :class="getIconClass(item, isActive)">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 21" class="w-6 h-6">
                <path
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M1,9c0-.59.26-1.15.71-1.53L8.71,1.47c.75-.63,1.84-.63,2.58,0l7,6c.45.38.71.94.71,1.53v9c0,1.1-.9,2-2,2H3c-1.1,0-2-.9-2-2v-9Z"
                  fill="none"
                />
              </svg>
            </div>
            <div v-else-if="item.label === 'Chatbot'" :class="getIconClass(item, isActive)">
              <span class="material-icons">chat_bubble</span>
            </div>
            <i v-else class="pi" :class="getIconClass(item, isActive)"></i>
          </RouterLink>
          <button
            v-else
            @click="handleClick(item)"
            :aria-label="item.label"
            :title="item.label"
            class="flex flex-1 items-center justify-center transition-colors duration-200 text-surface-400"
          >
            <div v-if="item.label === 'Menu'" :class="getIconClass(item, false)">
              <span class="material-symbols-outlined">apps</span>
            </div>
            <i v-else :class="getIconClass(item, false)"></i>
          </button>
        </template>
      </div>
    </nav>
  </div>
</template>

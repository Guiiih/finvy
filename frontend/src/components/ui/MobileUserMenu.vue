<script setup lang="ts">
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'

const authStore = useAuthStore()
const router = useRouter()

const visible = defineModel<boolean>('visible')

const handleLogout = async () => {
  await authStore.signOut()
  router.push('/login')
}

const closeMenu = () => {
  visible.value = false
}

const handleSettingsClick = () => {
  router.push('/settings')
  closeMenu()
}

const handleHelpClick = () => {
  // TODO: Implement help page navigation
  closeMenu()
}
</script>

<template>
  <div v-if="visible" class="fixed inset-0 z-[1000] bg-surface-100">
    <div class="p-6 flex flex-col text-surface-900">
      <!-- Header with close button -->
      <div class="flex justify-end mb-8">
        <Button
          icon="pi pi-times"
          text
          rounded
          @click="closeMenu"
          class="text-surface-700 h-10 w-10"
          aria-label="Fechar menu"
        />
      </div>

      <!-- User Info -->
      <div class="flex items-center px-4 py-3">
        <div
          class="h-12 w-12 rounded-full mr-4 bg-surface-200 flex items-center justify-center text-surface-500 text-sm"
        >
          <img
            v-if="authStore.avatarUrl"
            :src="authStore.avatarUrl ?? undefined"
            alt="User Avatar"
            class="h-full w-full rounded-full object-cover"
          />
          <span v-else>Avatar</span>
        </div>
        <div>
          <p class="text-lg font-semibold">
            {{ authStore.username || authStore.user?.email }}
          </p>
          <p class="text-sm text-surface-500">{{ authStore.user?.email }}</p>
        </div>
      </div>

      <!-- Menu Items -->
      <nav class="mt-8 space-y-4">
        <button
          @click="handleSettingsClick"
          class="w-full flex items-center p-4 text-left hover:bg-surface-50 rounded-lg transition-colors"
        >
          <i class="pi pi-cog mr-4 text-2xl"></i>
          <div>
            <p class="text-lg">Configurações</p>
            <p class="text-sm text-surface-500">Gerencie dados e preferências</p>
          </div>
        </button>
        <button
          @click="handleHelpClick"
          class="w-full flex items-center p-4 text-left hover:bg-surface-50 rounded-lg transition-colors"
        >
          <i class="pi pi-question-circle mr-4 text-2xl"></i>
          <div>
            <p class="text-lg">Ajuda</p>
            <p class="text-sm text-surface-500">Central de ajuda e documentação</p>
          </div>
        </button>
        <button
          @click="handleLogout"
          class="w-full flex items-center p-4 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <i class="pi pi-sign-out mr-4 text-2xl"></i>
          <span class="text-lg">Sair</span>
        </button>
      </nav>
    </div>
  </div>
</template>

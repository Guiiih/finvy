<script setup lang="ts">

import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'vue-router'


const authStore = useAuthStore()
const router = useRouter()

const emit = defineEmits(['close'])


const handleLogout = async () => {
  await authStore.signOut()
  router.push('/login')
}


const closeMenu = () => {
  emit('close')
}

</script>

<template>
  <div class="absolute right-0 mt-2 w-64 bg-surface-0 rounded-md shadow-lg py-1 z-50" @click.stop>
    <div class="flex items-center px-4 py-3 border-b border-surface-200">
      <img :src="authStore.avatarUrl || '@/assets/LogoIcon.svg'" alt="User Avatar" class="h-10 w-10 rounded-full mr-3" />
      <div>
        <p class="text-sm font-medium text-surface-900">{{ authStore.username || authStore.user?.email }}</p>
        <p class="text-sm text-surface-500">{{ authStore.user?.email }}</p>
      </div>
    </div>
    <div class="block px-4 py-2 text-sm text-surface-700 hover:bg-surface-100" @click="router.push('/settings')">
      <div class="flex items-center">
        <i class="pi pi-cog mr-3"></i>
        <div>
          <p>Configurações</p>
          <p class="text-xs text-surface-500">Gerencie dados e preferências</p>
        </div>
      </div>
    </div>
    <div class="block px-4 py-2 text-sm text-surface-700 hover:bg-surface-100" @click="router.push('/help'); closeMenu()">
      <div class="flex items-center">
        <i class="pi pi-question-circle mr-3"></i>
        <div>
          <p>Ajuda</p>
          <p class="text-xs text-surface-500">Central de ajuda e documentação</p>
        </div>
      </div>
    </div>
    <div class="border-t border-surface-200 my-1"></div>
    <button class="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-md" @click="handleLogout">
      <i class="pi pi-sign-out mr-3"></i>
      Sair
    </button>
  </div>
</template>

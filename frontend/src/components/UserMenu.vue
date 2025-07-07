<template>
  <div class="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg py-1 z-50">
    <div class="flex items-center px-4 py-3 border-b border-gray-200">
      <img :src="avatarUrl" alt="User Avatar" class="h-10 w-10 rounded-full mr-3" />
      <div>
        <p class="text-sm font-medium text-gray-900">{{ userName }}</p>
        <p class="text-sm text-gray-500">{{ userEmail }}</p>
      </div>
    </div>
    <RouterLink to="/settings" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
      <div class="flex items-center">
        <i class="pi pi-cog mr-3"></i>
        <div>
          <p>Configurações</p>
          <p class="text-xs text-gray-500">Gerencie dados e preferências</p>
        </div>
      </div>
    </RouterLink>
    <RouterLink to="/help" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
      <div class="flex items-center">
        <i class="pi pi-question-circle mr-3"></i>
        <div>
          <p>Ajuda</p>
          <p class="text-xs text-gray-500">Central de ajuda e documentação</p>
        </div>
      </div>
    </RouterLink>
    <div class="border-t border-gray-200 my-1"></div>
    <button @click="handleLogout" class="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-md">
      <i class="pi pi-sign-out mr-3"></i>
      Sair
    </button>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'
import { RouterLink } from 'vue-router'

const props = defineProps({
  userName: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  avatarUrl: {
    type: String,
    default: '../assets/LogoIcon.svg' // Default avatar if none is provided
  }
})

const emit = defineEmits(['logout'])

const handleLogout = () => {
  emit('logout')
}
</script>

<style scoped>
/* Adicione estilos específicos do componente aqui, se necessário */
</style>

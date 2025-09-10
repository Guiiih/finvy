<script setup lang="ts">
import { RouterLink } from 'vue-router'
import Button from 'primevue/button'
import FinvyLogo from '@/assets/FinvyLogo.svg'

const visible = defineModel<boolean>('visible')

const moreNavItems = [
  { to: '/accounts', icon: 'pi-book', label: 'Contas' },
  { to: '/journal-entries', icon: 'pi-file-edit', label: 'Lançamentos' },
  { to: '/products', icon: 'pi-box', label: 'Produtos' },
  { to: '/stock-control', icon: 'pi-chart-bar', label: 'Estoque' },
  { to: '/ledger', icon: 'pi-list', label: 'Razão' },
  { to: '/reports', icon: 'pi-file-excel', label: 'Relatórios' },
]
</script>

<template>
  <div v-if="visible" class="fixed inset-0 z-[1000] bg-surface-900/70 backdrop-blur-md">
    <div class="p-6 flex flex-col">
      <div class="flex justify-between items-center mb-12">
        <img :src="FinvyLogo" alt="Finvy Logo" class="h-10 w-10" />
        <Button
          icon="pi pi-times"
          text
          rounded
          @click="visible = false"
          class="text-surface-200 h-10 w-10"
          aria-label="Fechar menu"
        />
      </div>
      <div>
        <h2 class="text-sm font-semibold text-surface-400 mb-4 px-4">Mais Opções</h2>
        <nav class="grid grid-cols-3 gap-4 text-center">
          <RouterLink
            v-for="item in moreNavItems"
            :key="item.to"
            :to="item.to"
            class="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-surface-800 transition-colors"
            @click="visible = false"
          >
            <div
              class="bg-surface-800 h-16 w-16 rounded-lg flex items-center justify-center border border-surface-700"
            >
              <i class="pi text-2xl text-surface-200" :class="item.icon"></i>
            </div>
            <span class="mt-2 text-sm text-surface-300">{{ item.label }}</span>
          </RouterLink>
        </nav>
      </div>
    </div>
  </div>
</template>

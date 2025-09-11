<script setup lang="ts">
import { RouterLink } from 'vue-router'
import Button from 'primevue/button'
import stockIcon from '@/assets/Stock.png'
import ledgerIcon from '@/assets/Ledger.png'
import productIcon from '@/assets/Product.png'
import reportsIcon from '@/assets/Reports.png'
import accountIcon from '@/assets/Account.png'
import journalIcon from '@/assets/Journal.png'

interface NavItem {
  to: string;
  label: string;
  icon?: string;
  image?: string;
}

const visible = defineModel<boolean>('visible')

const moreNavItems: NavItem[] = [
  { to: '/accounts', image: accountIcon, label: 'Plano de Contas' },
  { to: '/journal-entries', image: journalIcon, label: 'Lançamentos' },
  { to: '/products', image: productIcon, label: 'Produtos' },
  { to: '/stock-control', image: stockIcon, label: 'Estoque' },
  { to: '/ledger', image: ledgerIcon, label: 'Razão' },
  { to: '/reports', image: reportsIcon, label: 'Relatórios' },
]
</script>

<template>
  <div v-if="visible" class="fixed inset-0 z-[1000] bg-surface-100">
    <div class="p-6 flex flex-col">
      <div class="flex justify-end items-center mb-12">
        <Button
          icon="pi pi-times"
          text
          rounded
          @click="visible = false"
          class="text-surface-800 h-10 w-10"
          aria-label="Fechar menu"
        />
      </div>
      <div>
        <h2 class="text-sm font-semibold text-surface-500 mb-4 px-4">Modulos</h2>
        <nav class="grid grid-cols-3 gap-4 text-center">
          <RouterLink
            v-for="item in moreNavItems"
            :key="item.to"
            :to="item.to"
            class="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-surface-200 transition-colors"
            @click="visible = false"
          >
            <div class="h-20 w-20 rounded-lg flex items-center justify-center">
              <i v-if="item.icon" class="pi text-3xl text-surface-800" :class="item.icon"></i>
              <img v-else-if="item.image" :src="item.image" :alt="item.label" class="h-20 w-20" />
            </div>
            <span class="mt-2 text-sm text-surface-700">{{ item.label }}</span>
          </RouterLink>
        </nav>
      </div>
    </div>
  </div>
</template>

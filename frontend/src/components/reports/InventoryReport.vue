<script setup lang="ts">
import Card from 'primevue/card'
import { computed } from 'vue'
import { useReportStore } from '@/stores/reportStore'

const reportStore = useReportStore()

const inventoryData = computed(() => reportStore.inventory)
</script>

<template>
  <Card>
    <template #title>Relatório de Estoque</template>
    <template #content>
      <div v-if="reportStore.loading" class="text-center p-8">
        <i class="pi pi-spin pi-spinner text-5xl text-surface-400"></i>
        <p class="mt-4 text-xl text-surface-500">Carregando dados do estoque...</p>
      </div>
      <div v-else-if="reportStore.error" class="text-center p-8">
        <i class="pi pi-exclamation-triangle text-5xl text-red-500"></i>
        <p class="mt-4 text-xl text-red-500">{{ reportStore.error }}</p>
      </div>
      <div v-else-if="!inventoryData" class="text-center p-8">
        <i class="pi pi-inbox text-5xl text-surface-400"></i>
        <p class="mt-4 text-xl text-surface-500">Relatório não encontrado</p>
        <p class="text-surface-400">Não há dados de estoque para o período selecionado.</p>
      </div>
      <div v-else>
        <!-- TODO: Renderizar os dados reais do relatório de estoque aqui -->
        <p>Dados do relatório de estoque seriam exibidos aqui.</p>
      </div>
    </template>
  </Card>
</template>

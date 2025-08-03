<script setup lang="ts">
import Card from 'primevue/card';
import { ref, onMounted } from 'vue';
// TODO: Importar o serviço da API para buscar os dados
// import { api } from '@/services/api';

const loading = ref(true);
const error = ref<string | null>(null);

// TODO: Definir a estrutura de dados para o relatório de estoque
const inventoryData = ref(null);

// TODO: Implementar a busca de dados reais da API
const fetchInventoryData = async () => {
  loading.value = true;
  error.value = null;
  try {
    // const response = await api.get('/reports/inventory', { params: { period: 'YYYY-MM' } });
    // inventoryData.value = response.data;

    // Simulando uma chamada de API com dados mocados (ou a ausência deles)
    await new Promise(resolve => setTimeout(resolve, 1000));
    inventoryData.value = null; // Simula que nenhum dado foi encontrado

  } catch (err) {
    error.value = 'Falha ao buscar os dados do relatório de estoque.';
    console.error(err);
  } finally {
    loading.value = false;
  }
};

onMounted(fetchInventoryData);

</script>

<template>
    <Card>
        <template #title>Relatório de Estoque</template>
        <template #content>
            <div v-if="loading" class="text-center p-8">
                <i class="pi pi-spin pi-spinner text-5xl text-surface-400"></i>
                <p class="mt-4 text-xl text-surface-500">Carregando dados do estoque...</p>
            </div>
            <div v-else-if="error" class="text-center p-8">
                <i class="pi pi-exclamation-triangle text-5xl text-red-500"></i>
                <p class="mt-4 text-xl text-red-500">{{ error }}</p>
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

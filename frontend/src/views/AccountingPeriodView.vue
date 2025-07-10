<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-4">Gestão de Períodos Contábeis</h1>

    <div class="mb-6 flex items-center space-x-4">
      <div class="relative flex-grow">
        <input
          type="text"
          v-model="searchTerm"
          placeholder="Busque um período contábil"
          class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <svg
          class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          ></path>
        </svg>
      </div>
      <button
        @click="showCreatePeriodForm = !showCreatePeriodForm"
        class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out"
      >
        {{ showCreatePeriodForm ? 'Fechar Formulário' : 'Novo Período' }}
      </button>
    </div>

    <div v-if="showCreatePeriodForm" class="mb-6 p-4 border rounded-lg shadow-sm bg-white">
      <h2 class="text-xl font-semibold mb-3">Criar Novo Período</h2>
      <form @submit.prevent="handleCreatePeriod" class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label for="periodName" class="block text-sm font-medium text-gray-700"
            >Nome do Período</label
          >
          <input
            type="text"
            id="periodName"
            v-model="newPeriod.name"
            required
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
        </div>
        <div>
          <label for="startDate" class="block text-sm font-medium text-gray-700"
            >Data de Início</label
          >
          <input
            type="date"
            id="startDate"
            v-model="newPeriod.start_date"
            required
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
        </div>
        <div>
          <label for="endDate" class="block text-sm font-medium text-gray-700">Data de Fim</label>
          <input
            type="date"
            id="endDate"
            v-model="newPeriod.end_date"
            required
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
        </div>
        <div class="md:col-span-3 flex justify-end">
          <button
            type="submit"
            :disabled="accountingPeriodStore.loading"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            {{ accountingPeriodStore.loading ? 'Criando...' : 'Criar Período' }}
          </button>
        </div>
      </form>
      <p v-if="accountingPeriodStore.error" class="text-red-500 text-sm mt-2">
        {{ accountingPeriodStore.error }}
      </p>
    </div>

    <div class="bg-white p-4 rounded-lg shadow-sm">
      <h2 class="text-xl font-semibold mb-3">Períodos Existentes</h2>
      <p v-if="accountingPeriodStore.loading" class="text-gray-600">Carregando períodos...</p>
      <p v-else-if="accountingPeriodStore.error" class="text-red-500">
        Erro ao carregar períodos: {{ accountingPeriodStore.error }}
      </p>
      <ul v-else-if="filteredAccountingPeriods.length > 0" class="space-y-3">
        <li
          v-for="period in filteredAccountingPeriods"
          :key="period.id"
          class="flex items-center justify-between p-3 border rounded-md bg-gray-50"
        >
          <div>
            <p class="font-medium">
              {{ period.name }} ({{ formatDate(period.start_date) }} -
              {{ formatDate(period.end_date) }})
            </p>
            <span
              :class="[
                period.is_active ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-800',
                'px-2 py-0.5 rounded-full text-xs font-semibold',
              ]"
            >
              {{ period.is_active ? 'Ativo' : 'Inativo' }}
            </span>
          </div>
          <div class="space-x-2">
            <button
              v-if="!period.is_active"
              @click="setActive(period.id)"
              class="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-50"
            >
              Definir como Ativo
            </button>
            <button
              @click="deletePeriod(period.id)"
              class="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50"
            >
              Excluir
            </button>
          </div>
        </li>
      </ul>
      <p v-else class="text-gray-600">Nenhum período contábil encontrado. Crie um novo acima.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useAccountingPeriodStore } from '@/stores/accountingPeriodStore';
import { useToast } from 'primevue/usetoast';

const accountingPeriodStore = useAccountingPeriodStore();
const { accountingPeriods, loading, error } = storeToRefs(accountingPeriodStore);
const toast = useToast();

const newPeriod = ref({
  name: '',
  start_date: null as string | null,
  end_date: null as string | null,
});

const searchTerm = ref('');
const showCreatePeriodForm = ref(false);

const filteredAccountingPeriods = computed(() => {
  const lowerCaseSearchTerm = searchTerm.value.toLowerCase();
  return accountingPeriods.value.filter(
    (period) =>
      period.name.toLowerCase().includes(lowerCaseSearchTerm) ||
      formatDate(period.start_date).toLowerCase().includes(lowerCaseSearchTerm) ||
      formatDate(period.end_date).toLowerCase().includes(lowerCaseSearchTerm)
  );
});

onMounted(() => {
  accountingPeriodStore.fetchAccountingPeriods();
});

const handleCreatePeriod = async () => {
  if (!newPeriod.value.name || !newPeriod.value.start_date || !newPeriod.value.end_date) {
    toast.add({ severity: 'warn', summary: 'Atenção', detail: 'Preencha todos os campos para criar um novo período.', life: 3000 });
    return;
  }

  try {
    await accountingPeriodStore.addAccountingPeriod({
      name: newPeriod.value.name,
      start_date: newPeriod.value.start_date as string,
      end_date: newPeriod.value.end_date as string,
      is_active: true, // Novo período sempre se torna ativo
    });
    toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Período contábil criado e ativado com sucesso!', life: 3000 });
    newPeriod.value = { name: '', start_date: null, end_date: null }; // Limpa o formulário
    showCreatePeriodForm.value = false; // Fecha o formulário após a criação
  } catch (err: any) {
    toast.add({ severity: 'error', summary: 'Erro', detail: err.message || 'Falha ao criar período contábil.', life: 3000 });
  }
};

const setActive = async (id: string) => {
  try {
    await accountingPeriodStore.setActivePeriod(id);
    toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Período contábil definido como ativo!', life: 3000 });
  } catch (err: any) {
    toast.add({ severity: 'error', summary: 'Erro', detail: err.message || 'Falha ao definir período como ativo.', life: 3000 });
  }
};

const deletePeriod = async (id: string) => {
  if (confirm('Tem certeza que deseja excluir este período contábil?')) {
    try {
      await accountingPeriodStore.deleteAccountingPeriod(id);
      toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Período contábil excluído com sucesso!', life: 3000 });
    } catch (err: any) {
      toast.add({ severity: 'error', summary: 'Erro', detail: err.message || 'Falha ao excluir período contábil.', life: 3000 });
    }
  }
};

const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('pt-BR', options);
};
</script>

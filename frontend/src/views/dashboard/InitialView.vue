<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import InfoCard from '@/components/InfoCard.vue'
import { useReportStore } from '@/stores/reportStore'
import { useAuthStore } from '@/stores/authStore'
import { useOrganizationStore } from '@/stores/organizationStore'
import Chart from 'primevue/chart'
import { api } from '@/services/api'
import type { Organization } from '@/types/organization'

const reportStore = useReportStore()
const authStore = useAuthStore()
const organizationStore = useOrganizationStore()

const startDate = ref('')
const endDate = ref('')
const userName = ref('Usuário')
const organizationName = ref('Sua Organização')

const totalAtivo = computed(() => reportStore.balanceSheetData.totalDoAtivo)
const lucroLiquido = computed(() => reportStore.dreData.lucroLiquido)
const totalPassivo = computed(() => reportStore.balanceSheetData.totalDoPassivo)

const chartData = ref({})
const chartOptions = ref({})

onMounted(async () => {
  const today = new Date()
  endDate.value = today.toISOString().split('T')[0]
  startDate.value = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0]
  await reportStore.fetchReports(startDate.value, endDate.value)

  if (authStore.username) {
    userName.value = authStore.username
  }

  if (authStore.userOrganizationId) {
    try {
      const organizations = await api.get<Organization[]>('/organizations')
      const currentOrg = organizations.find(
        (org: Organization) => org.id === authStore.userOrganizationId
      )
      if (currentOrg) {
        organizationName.value = currentOrg.name
      }
    } catch (error) {
      console.error('Erro ao buscar nome da organização:', error)
    }
  }

  // Dados de exemplo para o gráfico (substituir por dados reais da store)
  chartData.value = {
    labels: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho'],
    datasets: [
      {
        label: 'Receita',
        data: [65, 59, 80, 81, 56, 55, 40],
        fill: false,
        borderColor: '#42A5F5',
        tension: 0.4
      },
      {
        label: 'Despesa',
        data: [28, 48, 40, 19, 86, 27, 90],
        fill: false,
        borderColor: '#FFA726',
        tension: 0.4
      }
    ]
  }

  chartOptions.value = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#495057'
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#495057'
        },
        grid: {
          color: '#ebedef'
        }
      },
      y: {
        ticks: {
          color: '#495057'
        },
        grid: {
          color: '#ebedef'
        }
      }
    }
  }
})
</script>

<template>
  <div class="p-4 sm:p-6 max-w-7xl mx-auto">
    <!-- Banner de Boas-Vindas -->
    <div class="bg-primary-500 text-white p-6 rounded-lg shadow-lg mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold mb-2">Olá, {{ userName }}!</h1>
        <p class="text-lg">Bem-vindo(a) à {{ organizationName }}.</p>
      </div>
      <!-- Ícone ou imagem inspirada no Creative outdoor ads.png -->
      <i class="pi pi-chart-line text-6xl opacity-75"></i>
    </div>

    <!-- Seção de Cartões de Resumo -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <InfoCard title="Total do Ativo" :value="totalAtivo" currency="R$" :is-positive="true" />
      <InfoCard
        title="Lucro Líquido"
        :value="lucroLiquido"
        currency="R$"
        :is-positive="lucroLiquido >= 0"
      />
      <InfoCard title="Total do Passivo" :value="totalPassivo" currency="R$" :is-positive="null" />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Gráfico de Tendências Financeiras -->
      <div class="lg:col-span-2 bg-surface-0 p-6 rounded-lg shadow-md">
        <h2 class="text-xl font-semibold mb-4 text-surface-800">Tendências Financeiras</h2>
        <div class="h-80">
          <Chart type="line" :data="chartData" :options="chartOptions" />
        </div>
      </div>

      <!-- Atividade Recente -->
      <div class="lg:col-span-1">
        <!-- Atividade Recente -->
        <div class="bg-surface-0 p-6 rounded-lg shadow-md flex-grow">
          <h2 class="text-xl font-semibold mb-4 text-surface-800">Atividade Recente</h2>
          <p class="text-surface-600">Nenhuma atividade recente para exibir.</p>
          <!-- Adicionar lista de atividades aqui -->
        </div>
      </div>
    </div>
  </div>
</template>

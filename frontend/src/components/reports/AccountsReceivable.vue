<script setup lang="ts">
import Card from 'primevue/card';
import Chart from 'primevue/chart';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import ProgressBar from 'primevue/progressbar';
import { ref, onMounted, reactive, computed } from 'vue';
// TODO: Importar o serviço da API para buscar os dados
// import { api } from '@/services/api';

const loading = ref(true);
const error = ref<string | null>(null);

// Estrutura de dados reativa para armazenar os dados de Contas a Receber
interface SummaryData {
  totalToReceive: number;
  overdue: number;
  overduePercentage: number;
  clients: number;
}

interface AgingData {
  [key: string]: { value: number; percentage: number };
}

interface DetailData {
  client: string;
  value: number;
  dueDate: string;
  status: string;
}

interface AccountsReceivableReportData {
  summary: SummaryData;
  aging: AgingData;
  details: DetailData[];
}

const accountsReceivableData = reactive<AccountsReceivableReportData>({
  summary: {
    totalToReceive: 0,
    overdue: 0,
    overduePercentage: 0,
    clients: 0,
  },
  aging: {},
  details: [],
});

// Função para formatar valores monetários
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

// TODO: Implementar a busca de dados reais da API
const fetchAccountsReceivableData = async () => {
  loading.value = true;
  error.value = null;
  try {
    // const response = await api.get('/reports/accounts-receivable', { params: { period: 'YYYY-MM' } });
    // Object.assign(accountsReceivableData, response.data);

    // TODO: Remover esta simulação e descomentar a chamada real da API
    // await new Promise(resolve => setTimeout(resolve, 1000));
    // Object.assign(accountsReceivableData, response.data);

  } catch (err) {
    error.value = 'Falha ao buscar os dados de Contas a Receber.';
    console.error(err);
  } finally {
    loading.value = false;
  }
};

// Opções do gráfico
const agingChartOptions = ref({
    plugins: {
        legend: {
            position: 'right',
            labels: { usePointStyle: true }
        }
    }
});

// Dados computados para o gráfico
const agingChartData = computed(() => ({
    labels: Object.keys(accountsReceivableData.aging).map(k => `${k} dias (${accountsReceivableData.aging[k as keyof typeof accountsReceivableData.aging].percentage}%)`),
    datasets: [{
        data: Object.values(accountsReceivableData.aging).map((v: any) => v.value),
        backgroundColor: ['#3B82F6', '#F97316', '#F59E0B', '#EF4444'],
    }]
}));

const getStatusSeverity = (status: string) => {
  return status === 'Em dia' ? 'success' : 'danger';
};

// Buscar os dados quando o componente for montado
onMounted(fetchAccountsReceivableData);

</script>

<template>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card class="text-center">
            <template #title>Total a Receber</template>
            <template #content>
                <p class="text-3xl font-bold text-blue-500">{{ formatCurrency(accountsReceivableData.summary.totalToReceive) }}</p>
                <p class="text-surface-500">{{ accountsReceivableData.summary.clients }} clientes</p>
            </template>
        </Card>
        <Card class="text-center">
            <template #title>Valores em Atraso</template>
            <template #content>
                <p class="text-3xl font-bold text-red-500">{{ formatCurrency(accountsReceivableData.summary.overdue) }}</p>
                <p class="text-surface-500">{{ accountsReceivableData.summary.overduePercentage }}% do total</p>
            </template>
        </Card>
        <Card>
            <template #title>Análise de Aging</template>
            <template #content>
                <div class="h-48 flex items-center justify-center">
                    <Chart type="pie" :data="agingChartData" :options="agingChartOptions" />
                </div>
            </template>
        </Card>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
            <template #title>Detalhamento por Cliente</template>
            <template #content>
                <DataTable :value="accountsReceivableData.details" responsiveLayout="scroll">
                    <Column field="client" header="Cliente"></Column>
                    <Column field="value" header="Valor">
                        <template #body="{ data }">{{ formatCurrency(data.value) }}</template>
                    </Column>
                    <Column field="dueDate" header="Vencimento"></Column>
                    <Column field="status" header="Status">
                        <template #body="{ data }">
                            <Tag :severity="getStatusSeverity(data.status)" :value="data.status"></Tag>
                        </template>
                    </Column>
                </DataTable>
            </template>
        </Card>
        <Card>
            <template #title>Análise de Aging</template>
            <template #content>
                <div class="space-y-4">
                    <div v-for="(data, range) in accountsReceivableData.aging" :key="range">
                        <div class="flex justify-between mb-1">
                            <span>{{ range }} dias</span>
                            <span class="font-medium">{{ formatCurrency(data.value) }} ({{ data.percentage }}%)</span>
                        </div>
                        <ProgressBar :value="data.percentage" :showValue="false" style="height: 1.5rem"></ProgressBar>
                    </div>
                </div>
            </template>
        </Card>
    </div>
</template>

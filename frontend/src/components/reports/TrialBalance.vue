<script setup lang="ts">
import Card from 'primevue/card';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import { ref, onMounted, reactive, computed } from 'vue';
// TODO: Importar o serviço da API para buscar os dados
// import { api } from '@/services/api';

const loading = ref(true);
const error = ref<string | null>(null);

// Estrutura de dados reativa para armazenar os dados do balancete
interface SummaryData {
  totalDebits: number;
  totalCredits: number;
  difference: number;
}

interface AccountEntry {
  code: string;
  name: string;
  type: string;
  debit: number | null;
  credit: number | null;
  balance: number;
}

interface TrialBalanceReportData {
  summary: SummaryData;
  accounts: AccountEntry[];
}

const trialBalanceData = reactive<TrialBalanceReportData>({
  summary: {
    totalDebits: 0,
    totalCredits: 0,
    difference: 0,
  },
  accounts: [],
});

// Função para formatar valores monetários
const formatCurrency = (value: number) => {
  const options: Intl.NumberFormatOptions = { style: 'currency', currency: 'BRL' };
  return new Intl.NumberFormat('pt-BR', options).format(value);
};

// TODO: Implementar a busca de dados reais da API
const fetchTrialBalanceData = async () => {
  loading.value = true;
  error.value = null;
  try {
    // const response = await api.get('/reports/trial-balance', { params: { period: 'YYYY-MM' } });
    // Object.assign(trialBalanceData, response.data);

    // TODO: Remover esta simulação e descomentar a chamada real da API
    // await new Promise(resolve => setTimeout(resolve, 1000));
    // Object.assign(trialBalanceData, response.data);

  } catch (err) {
    error.value = 'Falha ao buscar os dados do balancete.';
    console.error(err);
  } finally {
    loading.value = false;
  }
};

// Propriedades computadas para totais
const totalDebits = computed(() => trialBalanceData.accounts.reduce((sum, acc) => sum + (acc.debit || 0), 0));
const totalCredits = computed(() => trialBalanceData.accounts.reduce((sum, acc) => sum + (acc.credit || 0), 0));
const totalBalance = computed(() => trialBalanceData.accounts.reduce((sum, acc) => sum + acc.balance, 0));

// Buscar os dados quando o componente for montado
onMounted(fetchTrialBalanceData);

</script>

<template>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card class="text-center">
            <template #title>Total Débitos</template>
            <template #content>
                <p class="text-2xl font-bold text-blue-500">{{ formatCurrency(trialBalanceData.summary.totalDebits) }}</p>
            </template>
        </Card>
        <Card class="text-center">
            <template #title>Total Créditos</template>
            <template #content>
                <p class="text-2xl font-bold text-orange-500">{{ formatCurrency(trialBalanceData.summary.totalCredits) }}</p>
            </template>
        </Card>
        <Card class="text-center">
            <template #title>Diferença</template>
            <template #content>
                <p class="text-2xl font-bold" :class="trialBalanceData.summary.difference === 0 ? 'text-green-500' : 'text-red-500'">
                    {{ formatCurrency(trialBalanceData.summary.difference) }}
                </p>
            </template>
        </Card>
    </div>

    <Card>
        <template #title>Balancete de Verificação</template>
        <template #subtitle>Lista de todas as contas com seus respectivos saldos</template>
        <template #content>
            <DataTable :value="trialBalanceData.accounts" responsiveLayout="scroll">
                <Column field="code" header="Código"></Column>
                <Column field="name" header="Conta"></Column>
                <Column field="type" header="Tipo"></Column>
                <Column field="debit" header="Débito">
                    <template #body="{ data }">
                        {{ data.debit ? formatCurrency(data.debit) : '-' }}
                    </template>
                </Column>
                <Column field="credit" header="Crédito">
                    <template #body="{ data }">
                        {{ data.credit ? formatCurrency(data.credit) : '-' }}
                    </template>
                </Column>
                <Column field="balance" header="Saldo">
                    <template #body="{ data }">
                        <span :class="data.balance >= 0 ? 'text-green-500' : 'text-red-500'">
                            {{ formatCurrency(data.balance) }}
                        </span>
                    </template>
                </Column>
                <template #footer>
                    <div class="grid grid-cols-6 font-bold">
                        <div class="col-span-3">TOTAIS</div>
                        <div>{{ formatCurrency(totalDebits) }}</div>
                        <div>{{ formatCurrency(totalCredits) }}</div>
                        <div :class="totalBalance >= 0 ? 'text-green-500' : 'text-red-500'">{{ formatCurrency(totalBalance) }}</div>
                    </div>
                </template>
            </DataTable>
        </template>
    </Card>
</template>

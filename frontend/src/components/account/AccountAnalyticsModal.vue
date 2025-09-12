<script setup lang="ts">
// Este componente exibe uma análise avançada do plano de contas.
// Atualmente, os gráficos são placeholders e requerem a integração de uma biblioteca de gráficos Vue (ex: PrimeVue Chart, Chart.js, ApexCharts, ECharts) para funcionalidade completa.
import { computed } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import { useAccountStore } from '@/stores/accountStore'

const { visible } = defineProps<{
  visible: boolean
}>()

const emit = defineEmits(['update:visible'])

const accountStore = useAccountStore()

const closeDialog = () => {
  emit('update:visible', false)
}

const accountSummary = computed(() => {
  const summary = {
    asset: { count: 0, balance: 0 },
    liability: { count: 0, balance: 0 },
    equity: { count: 0, balance: 0 },
    revenue: { count: 0, balance: 0 },
    expense: { count: 0, balance: 0 },
  }

  accountStore.accounts.forEach((account) => {
    if (summary[account.type]) {
      summary[account.type].count++
      summary[account.type].balance += account.balance || 0
    }
  })
  return summary
})

const totalAccounts = computed(() => accountStore.accounts.length)
const activeAccountsCount = computed(() => accountStore.accounts.filter((a) => a.is_active).length)
const accountsWithBalance = computed(
  () => accountStore.accounts.filter((a) => (a.balance || 0) !== 0).length,
)
const maxLevel = computed(() => {
  if (accountStore.accounts.length === 0) return 0
  return Math.max(...accountStore.accounts.map((a) => a.code.split('.').length)) - 1
})

const accountTypes = [
  { value: 'asset', label: 'Ativo' },
  { value: 'liability', label: 'Passivo' },
  { value: 'equity', label: 'Patrimônio Líquido' },
  { value: 'revenue', label: 'Receita' },
  { value: 'expense', label: 'Despesa' },
]

const getTypeColor = (type: string) => {
  switch (type) {
    case 'asset':
      return 'bg-blue-200'
    case 'liability':
      return 'bg-red-200'
    case 'equity':
      return 'bg-purple-200'
    case 'revenue':
      return 'bg-green-200'
    case 'expense':
      return 'bg-orange-200'
    default:
      return 'bg-gray-200'
  }
}
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="emit('update:visible', $event)"
    modal
    :style="{ width: '50vw' }"
    :closable="true"
  >
    <template #header>
      <div>
        <h2 class="text-base font-bold">Análise Avançada do Plano de Contas</h2>
        <p class="text-sm text-surface-500">
          Dashboard completo com métricas, gráficos e insights da estrutura contábil.
        </p>
      </div>
    </template>
    <div class="p-fluid space-y-8">
      <!-- Key Metrics -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-surface-0 rounded-lg p-4 flex items-center gap-3 border border-surface-200">
          <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <span class="material-symbols-outlined text-blue-600 text-xl">layers</span>
          </div>
          <div>
            <div class="text-base font-bold">{{ totalAccounts }}</div>
            <div class="text-sm text-surface-500">Total de Contas</div>
          </div>
        </div>

        <div class="bg-surface-0 rounded-lg p-4 flex items-center gap-3 border border-surface-200">
          <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <span class="material-symbols-outlined text-green-600 text-xl">vital_signs</span>
          </div>
          <div>
            <div class="text-base font-bold">{{ activeAccountsCount }}</div>
            <div class="text-sm text-surface-500">Contas Ativas</div>
          </div>
        </div>

        <div class="bg-surface-0 rounded-lg p-4 flex items-center gap-3 border border-surface-200">
          <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <span class="material-symbols-outlined text-purple-600 text-xl">target</span>
          </div>
          <div>
            <div class="text-base font-bold">{{ accountsWithBalance }}</div>
            <div class="text-sm text-surface-500">Com Saldo</div>
          </div>
        </div>

        <div class="bg-surface-0 rounded-lg p-4 flex items-center gap-3 border border-surface-200">
          <div class="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <i class="pi pi-chart-pie text-orange-600 text-xl"></i>
          </div>
          <div>
            <div class="text-base font-bold">{{ maxLevel + 1 }}</div>
            <div class="text-sm text-surface-500">Níveis</div>
          </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Account Distribution Pie Chart -->
        <div class="bg-surface-0 rounded-lg p-4 border border-surface-200">
          <h3 class="text-base font-bold text-surface-800">Distribuição por Tipo</h3>
          <p class="text-sm text-surface-500 mb-4">Percentual de contas por categoria contábil</p>
          <div class="h-80 flex items-center justify-center bg-surface-100 rounded-md">
            <p class="text-sm text-surface-400">
              <!-- TODO: Implementar Gráfico de Pizza aqui. Sugestões: PrimeVue Chart (com Chart.js), ApexCharts, ECharts. -->
              Gráfico de Pizza (requer biblioteca de gráficos)
            </p>
          </div>
        </div>

        <!-- Balance Analysis -->
        <div class="bg-surface-0 rounded-lg p-4 border border-surface-200">
          <h3 class="text-base font-bold text-surface-800">Análise de Saldos</h3>
          <p class="text-sm text-surface-500 mb-4">Valor total por tipo de conta</p>
          <div class="h-80 flex items-center justify-center bg-surface-100 rounded-md">
            <p class="text-sm text-surface-400">
              <!-- TODO: Implementar Gráfico de Barras aqui. Sugestões: PrimeVue Chart (com Chart.js), ApexCharts, ECharts. -->
              Gráfico de Barras (requer biblioteca de gráficos)
            </p>
          </div>
        </div>
      </div>

      <!-- Detailed Analysis -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Account Structure -->
        <div class="bg-surface-0 rounded-lg p-4 border border-surface-200">
          <h3 class="text-base font-bold text-surface-800">Estrutura Hierárquica</h3>
          <p class="text-sm text-surface-500 mb-4">
            Distribuição de contas por nível organizacional
          </p>
          <div class="space-y-4">
            <div v-for="level in maxLevel + 1" :key="level - 1" class="space-y-2">
              <div class="flex justify-between items-center">
                <div class="flex items-center gap-2">
                  <div
                    :class="[
                      `w-3 h-3 rounded-full`,
                      getTypeColor(accountTypes[level - 1]?.value || 'default'),
                    ]"
                  ></div>
                  <span class="font-medium text-sm">Nível {{ level - 1 }}</span>
                </div>
                <div class="text-right">
                  <div class="font-medium text-sm">
                    {{
                      accountStore.accounts.filter(
                        (a) => a.code.split('.').length - 1 === level - 1,
                      ).length
                    }}
                    contas
                  </div>
                  <div class="text-sm text-surface-500">
                    {{
                      (
                        (accountStore.accounts.filter(
                          (a) => a.code.split('.').length - 1 === level - 1,
                        ).length /
                          totalAccounts) *
                        100
                      ).toFixed(1)
                    }}%
                  </div>
                </div>
              </div>
              <div class="w-full bg-surface-200 rounded-full h-2">
                <div
                  :class="[
                    `h-2 rounded-full`,
                    getTypeColor(accountTypes[level - 1]?.value || 'default'),
                  ]"
                  :style="{
                    width: `${(accountStore.accounts.filter((a) => a.code.split('.').length - 1 === level - 1).length / totalAccounts) * 100}%`,
                  }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Type Analysis -->
        <div class="bg-surface-0 rounded-lg p-4 border border-surface-200">
          <h3 class="text-base font-bold text-surface-800">Análise Detalhada por Tipo</h3>
          <p class="text-sm text-surface-500 mb-4">
            Métricas específicas de cada categoria contábil
          </p>
          <div class="space-y-4">
            <div
              v-for="type in accountTypes"
              :key="type.value"
              class="p-4 border border-surface-200 rounded-lg"
            >
              <div class="flex items-center justify-between mb-3">
                <span
                  :class="[
                    `px-2.5 py-0.5 rounded-full text-xs font-medium`,
                    getTypeColor(type.value),
                  ]"
                >
                  {{ type.label }}
                </span>
                <span class="font-bold text-xs">
                  {{
                    accountSummary[
                      type.value as keyof typeof accountSummary
                    ].balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                  }}
                </span>
              </div>
              <div class="grid grid-cols-3 gap-4 text-xs">
                <div class="text-center">
                  <div class="font-medium text-xs">
                    {{ accountSummary[type.value as keyof typeof accountSummary].count }}
                  </div>
                  <div class="text-surface-500 text-xs">Total</div>
                </div>
                <div class="text-center">
                  <div class="font-medium text-xs">
                    {{
                      accountStore.accounts.filter((a) => a.type === type.value && a.is_active)
                        .length
                    }}
                  </div>
                  <div class="text-surface-500 text-xs">Ativas</div>
                </div>
                <div class="text-center">
                  <div class="font-medium text-xs">
                    {{
                      accountStore.accounts.filter(
                        (a) => a.type === type.value && (a.balance || 0) !== 0,
                      ).length
                    }}
                  </div>
                  <div class="text-surface-500 text-xs">C/ Saldo</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex justify-end">
        <Button label="Fechar Análise" @click="closeDialog" outlined size="small" />
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useReportStore } from '@/stores/reportStore'
import { useJournalEntryStore } from '@/stores/journalEntryStore'

const props = defineProps<{
  startDate: string
  endDate: string
  reportType?: string
}>()

const reportStore = useReportStore()
const journalEntryStore = useJournalEntryStore()

async function fetchBalanceSheetData() {
  await reportStore.fetchReports(props.startDate, props.endDate)
  await journalEntryStore.fetchJournalEntries()
}

watch(
  [() => props.startDate, () => props.endDate],
  () => {
    fetchBalanceSheetData()
  },
  { immediate: true },
)

const balanceSheetData = computed(() => reportStore.balanceSheetData)
</script>

<template>
  <div class="p-4 sm:p-6 max-w-7xl mx-auto bg-white rounded-lg shadow-md">
    <h1 class="text-2xl font-bold mb-4 text-center text-surface-800 border-b pb-2">
      Balanço Patrimonial
    </h1>

    <p
      v-if="!journalEntryStore.journalEntries || journalEntryStore.journalEntries.length === 0"
      class="text-center p-4 bg-surface-100 border border-surface-200 rounded-lg text-surface-600 italic mt-4"
    >
      Nenhum lançamento contábil registrado. Por favor, adicione lançamentos na tela "Lançamentos
      Contábeis" para gerar o Balanço Patrimonial.
    </p>

    <div v-else>
      <div class="flex flex-col md:flex-row justify-between gap-6 p-4">
        <div class="flex-1 p-4 relative">
          <h2
            class="text-xl font-semibold text-surface-700 mb-4 border-b-2 border-surface-500 pb-1 uppercase"
          >
            ATIVO
          </h2>
          <div class="mb-6" v-if="balanceSheetData.ativoCirculante !== 0">
            <h3
              class="text-lg font-semibold text-surface-600 mb-2 border-b border-surface-300 pb-1 uppercase"
            >
              ATIVO CIRCULANTE
            </h3>

            <div
              class="flex justify-between font-bold mb-1"
              v-if="balanceSheetData.disponibilidades !== 0"
            >
              <span>Disponibilidades</span>
              <span>R$ {{ balanceSheetData.disponibilidades.toFixed(2) }}</span>
            </div>
            <ul class="ml-4 text-sm text-surface-700">
              <li class="flex justify-between py-0.5" v-if="balanceSheetData.caixa !== 0">
                <span>Caixa</span><span>R$ {{ balanceSheetData.caixa.toFixed(2) }}</span>
              </li>
              <li class="flex justify-between py-0.5" v-if="balanceSheetData.caixaCef !== 0">
                <span>CFE</span><span>R$ {{ balanceSheetData.caixaCef.toFixed(2) }}</span>
              </li>
              <li class="flex justify-between py-0.5" v-if="balanceSheetData.bancoItau !== 0">
                <span>Banco Itaú</span><span>R$ {{ balanceSheetData.bancoItau.toFixed(2) }}</span>
              </li>
              <li class="flex justify-between py-0.5" v-if="balanceSheetData.bancoBradesco !== 0">
                <span>Banco Bradesco</span
                ><span>R$ {{ balanceSheetData.bancoBradesco.toFixed(2) }}</span>
              </li>
            </ul>

            <div
              class="flex justify-between font-bold mb-1 mt-2"
              v-if="balanceSheetData.clientes !== 0"
            >
              <span>Clientes</span>
              <span>R$ {{ balanceSheetData.clientes.toFixed(2) }}</span>
            </div>
            <ul class="ml-4 text-sm text-surface-700">
              <li class="flex justify-between py-0.5" v-if="balanceSheetData.clientes !== 0">
                <span>Clientes</span><span>R$ {{ balanceSheetData.clientes.toFixed(2) }}</span>
              </li>
            </ul>

            <div
              class="flex justify-between font-bold mb-1 mt-2"
              v-if="balanceSheetData.estoqueDeMercadorias !== 0"
            >
              <span>Estoque de Mercadorias</span>
              <span>R$ {{ balanceSheetData.estoqueDeMercadorias.toFixed(2) }}</span>
            </div>
            <ul class="ml-4 text-sm text-surface-700">
              <li
                class="flex justify-between py-0.5"
                v-if="balanceSheetData.estoqueDeMercadorias !== 0"
              >
                <span>Estoque</span
                ><span>R$ {{ balanceSheetData.estoqueDeMercadorias.toFixed(2) }}</span>
              </li>
            </ul>

            <div class="flex justify-between font-bold mt-4 pt-2 border-t border-surface-400">
              <span>Total do Ativo Circulante</span>
              <span>R$ {{ balanceSheetData.ativoCirculante.toFixed(2) }}</span>
            </div>
          </div>

          <div class="mb-6" v-if="balanceSheetData.ativoNaoCirculante !== 0">
            <h3
              class="text-lg font-semibold text-surface-600 mb-2 border-b border-surface-300 pb-1 uppercase"
            >
              ATIVO NÃO CIRCULANTE
            </h3>
            <div
              class="flex justify-between font-bold mb-1"
              v-if="balanceSheetData.moveisEUtensilios !== 0"
            >
              <span class="item-name">Imobilizado</span>
              <span>R$ {{ balanceSheetData.moveisEUtensilios.toFixed(2) }}</span>
            </div>
            <ul class="ml-4 text-sm text-surface-700">
              <li
                class="flex justify-between py-0.5"
                v-if="balanceSheetData.moveisEUtensilios !== 0"
              >
                <span>Móveis e Utensílios</span
                ><span>R$ {{ balanceSheetData.moveisEUtensilios.toFixed(2) }}</span>
              </li>
            </ul>
            <div class="flex justify-between font-bold mt-4 pt-2 border-t border-surface-400">
              <span>Total do Ativo Não Circulante</span>
              <span>R$ {{ balanceSheetData.ativoNaoCirculante.toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <div class="flex-1 p-4 relative md:border-l border-surface-200">
          <h2
            class="text-xl font-semibold text-surface-700 mb-4 border-b-2 border-surface-500 pb-1 uppercase"
          >
            PASSIVO
          </h2>
          <div class="mb-6" v-if="balanceSheetData.passivoCirculante !== 0">
            <h3
              class="text-lg font-semibold text-surface-600 mb-2 border-b border-surface-300 pb-1 uppercase"
            >
              PASSIVO CIRCULANTE
            </h3>

            <div
              class="flex justify-between font-bold mb-1"
              v-if="balanceSheetData.fornecedores !== 0"
            >
              <span>Fornecedores</span>
              <span>R$ {{ balanceSheetData.fornecedores.toFixed(2) }}</span>
            </div>
            <ul class="ml-4 text-sm text-surface-700">
              <li class="flex justify-between py-0.5" v-if="balanceSheetData.fornecedores !== 0">
                <span>Fornecedores</span
                ><span>R$ {{ balanceSheetData.fornecedores.toFixed(2) }}</span>
              </li>
            </ul>

            <div
              class="flex justify-between font-bold mb-1 mt-2"
              v-if="balanceSheetData.despesasComPessoal !== 0"
            >
              <span>Despesas com Pessoal</span>
              <span>R$ {{ balanceSheetData.despesasComPessoal.toFixed(2) }}</span>
            </div>
            <ul class="ml-4 text-sm text-surface-700">
              <li class="flex justify-between py-0.5" v-if="balanceSheetData.salariosAPagar !== 0">
                <span>Salários a Pagar</span
                ><span>R$ {{ balanceSheetData.salariosAPagar.toFixed(2) }}</span>
              </li>
            </ul>

            <div
              class="flex justify-between font-bold mb-1 mt-2"
              v-if="balanceSheetData.impostoAPagar !== 0"
            >
              <span>Imposto a pagar</span>
              <span>R$ {{ balanceSheetData.impostoAPagar.toFixed(2) }}</span>
            </div>
            <ul class="ml-4 text-sm text-surface-700">
              <li class="flex justify-between py-0.5" v-if="balanceSheetData.icmsARecolher !== 0">
                <span>ICMS a recolher</span
                ><span>R$ {{ balanceSheetData.icmsARecolher.toFixed(2) }}</span>
              </li>
            </ul>

            <div class="flex justify-between font-bold mt-4 pt-2 border-t border-surface-400">
              <span>Total do Passivo Circulante</span>
              <span>R$ {{ balanceSheetData.passivoCirculante.toFixed(2) }}</span>
            </div>
          </div>

          <div class="mb-6">
            <h3
              class="text-lg font-semibold text-surface-600 mb-2 border-b border-surface-300 pb-1 uppercase"
            >
              PASSIVO NÃO CIRCULANTE
            </h3>
            <div class="flex justify-between font-bold mt-4 pt-2 border-t border-surface-400">
              <span>Total do Passivo Não Circulante</span>
              <span>R$ {{ balanceSheetData.passivoNaoCirculante.toFixed(2) }}</span>
            </div>
          </div>

          <div class="mb-6" v-if="balanceSheetData.totalPatrimonioLiquido !== 0">
            <h3
              class="text-lg font-semibold text-surface-700 mb-2 border-b border-surface-300 pb-1 uppercase"
            >
              PATRIMÔNIO LÍQUIDO
            </h3>
            <ul class="text-sm text-surface-700">
              <div
                class="flex justify-between font-bold mb-1"
                v-if="balanceSheetData.capitalSocial !== 0"
              >
                <span>Capital Social</span>
                <span>R$ {{ balanceSheetData.capitalSocial.toFixed(2) }}</span>
              </div>
              <ul class="ml-4 text-sm text-surface-700">
                <li
                  class="flex justify-between py-0.5"
                  v-if="balanceSheetData.capitalSocialSubscrito !== 0"
                >
                  <span>Capital Social Subscrito</span
                  ><span>R$ {{ balanceSheetData.capitalSocialSubscrito.toFixed(2) }}</span>
                </li>
                <li
                  class="flex justify-between py-0.5"
                  v-if="balanceSheetData.capitalAIntegralizar !== 0"
                >
                  <span>Capital a Integralizar</span
                  ><span>-R$ {{ Math.abs(balanceSheetData.capitalAIntegralizar).toFixed(2) }}</span>
                </li>
              </ul>

              <div
                class="flex justify-between font-bold mb-1 mt-2"
                v-if="balanceSheetData.reservas > 0"
              >
                <span>Reservas</span>
                <span>R$ {{ balanceSheetData.reservas.toFixed(2) }}</span>
              </div>
              <ul class="ml-4 text-sm text-surface-700">
                <li class="flex justify-between py-0.5" v-if="balanceSheetData.reservaDeLucro > 0">
                  <span>Reserva de Lucro</span
                  ><span>R$ {{ balanceSheetData.reservaDeLucro.toFixed(2) }}</span>
                </li>
              </ul>
            </ul>
            <div class="flex justify-between font-bold mt-4 pt-2 border-t border-surface-400">
              <span>Total do Patrimônio Líquido</span>
              <span>R$ {{ balanceSheetData.totalPatrimonioLiquido.toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div
        class="flex flex-col md:flex-row justify-between w-full p-4 bg-surface-100 rounded-b-lg border-t border-surface-200"
      >
        <div
          class="flex-1 flex justify-between font-bold text-lg p-2 border-b md:border-b-0 md:border-r border-surface-300"
        >
          <h3>TOTAL DO ATIVO</h3>
          <span>R$ {{ balanceSheetData.totalDoAtivo.toFixed(2) }}</span>
        </div>
        <div class="flex-1 flex justify-between font-bold text-lg p-2">
          <h3>TOTAL DO PASSIVO</h3>
          <span>R$ {{ balanceSheetData.totalPassivoEPatrimonioLiquido.toFixed(2) }}</span>
        </div>
      </div>
    </div>

    <div
      class="text-center p-4 mt-4 rounded-lg font-bold text-lg"
      :class="{
        'bg-emerald-100 text-emerald-700 border border-emerald-200': balanceSheetData.isBalanced,
        'bg-red-100 text-red-700 border border-red-200': !balanceSheetData.isBalanced,
      }"
    >
      <p v-if="balanceSheetData.isBalanced">Não tem diferença</p>
      <p v-else>
        Balanço Patrimonial NÃO Balanceado! Diferença: R$
        {{ balanceSheetData.balanceDifference.toFixed(2) }}
      </p>
    </div>
  </div>
</template>

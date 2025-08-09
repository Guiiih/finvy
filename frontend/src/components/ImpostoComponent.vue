<script lang="ts" setup>
import { ref, watch } from 'vue'
import InputNumber from 'primevue/inputnumber'
import Card from 'primevue/card'
import Dropdown from 'primevue/dropdown'
import InputSwitch from 'primevue/inputswitch'
import Message from 'primevue/message'
import Button from 'primevue/button'
import { api } from '@/services/api'
import { useToast } from 'primevue/usetoast'
import type { FiscalOperationData, TaxData, InferredOperationTypeDetails } from '@/types'

const props = defineProps<{
  fiscalOperationData: FiscalOperationData,
  inferredOperationTypeDetails: InferredOperationTypeDetails
}>()

const emit = defineEmits(['update:fiscalOperationData'])

const toast = useToast()

const localFiscalOperationData = ref<FiscalOperationData>({
  operationType: props.fiscalOperationData.operationType,
  productServiceType: props.fiscalOperationData.productServiceType,
  ufOrigin: props.fiscalOperationData.ufOrigin,
  ufDestination: props.fiscalOperationData.ufDestination,
  cfop: props.fiscalOperationData.cfop,
  totalAmount: props.fiscalOperationData.totalAmount,
  freight: props.fiscalOperationData.freight,
  insurance: props.fiscalOperationData.insurance,
  discount: props.fiscalOperationData.discount,
  icmsSt: props.fiscalOperationData.icmsSt,
  ipiIncides: props.fiscalOperationData.ipiIncides,
  industrialOperation: props.fiscalOperationData.industrialOperation,
})

watch(
  localFiscalOperationData,
  (newValue) => {
    emit('update:fiscalOperationData', newValue)
  },
  { deep: true }
)

const validationErrors = ref<string[]>([])

const productServiceTypeOptions = ['Produto', 'Serviço']
const ufOptions = [
  { name: 'São Paulo', code: 'SP' },
  { name: 'Rio de Janeiro', code: 'RJ' },
  { name: 'Minas Gerais', code: 'MG' },
  { name: 'Bahia', code: 'BA' },
]
const cfopOptions = [
  { label: '1102 - Compra para comercialização', value: '1102' },
  { label: '1124 - Industrialização encomendada a outra empresa', value: '1124' },
  { label: '1403 - Compra para industrialização', value: '1403' },
  { label: '5101 - Venda de produção do estabelecimento', value: '5101' },
  { label: '5102 - Venda de mercadoria adquirida ou recebida de terceiros', value: '5102' },
  { label: '5401 - Venda de produção do estabelecimento em operação com produto sujeito ao regime de substituição tributária', value: '5401' },
  { label: '5403 - Venda de mercadoria adquirida ou recebida de terceiros, sujeita ao regime de substituição tributária', value: '5403' },
  { label: '5405 - Venda de mercadoria adquirida ou recebida de terceiros em operação com mercadoria sujeita ao regime de substituição tributária, na condição de contribuinte substituído', value: '5405' },
  { label: '6102 - Venda de mercadoria adquirida ou recebida de terceiros (interestadual)', value: '6102' },
  { label: '6403 - Venda de mercadoria adquirida ou recebida de terceiros, sujeita ao regime de substituição tributária (interestadual)', value: '6403' },
]

const calculateTaxes = async () => {
  validationErrors.value = []
  if (!localFiscalOperationData.value.productServiceType) validationErrors.value.push('Tipo de Produto/Serviço é obrigatório.')
  if (!localFiscalOperationData.value.ufOrigin) validationErrors.value.push('UF de origem é obrigatória.')
  if (!localFiscalOperationData.value.ufDestination) validationErrors.value.push('UF de destino é obrigatória.')
  if (!localFiscalOperationData.value.cfop) validationErrors.value.push('CFOP é obrigatório.')

  if (validationErrors.value.length === 0) {
    try {
      // Simulação de chamada de API para cálculo de impostos
      const response = await api.post<{ calculatedTaxes: TaxData }, FiscalOperationData>('/calculate-fiscal-taxes', localFiscalOperationData.value)
      toast.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: 'Impostos calculados com sucesso!',
        life: 3000,
      })
      // Emitir o evento de atualização com os dados fiscais e os impostos calculados
      emit('update:fiscalOperationData', { ...localFiscalOperationData.value, taxData: response.calculatedTaxes })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao calcular impostos.'
      toast.add({ severity: 'error', summary: 'Erro', detail: message, life: 3000 })
    }
  }
}

</script>

<template>
  <div class="space-y-6">
    <div class="p-4 bg-blue-50 rounded-lg">
      <div class="flex items-center gap-2 mb-2">
        <i class="pi pi-info-circle h-4 w-4 text-blue-600"></i>
        <span class="font-medium text-blue-900">Sistema Inteligente de Impostos</span>
      </div>
      <p class="text-sm text-blue-800">
        Regime Atual: Simples Nacional. Os impostos serão calculados automaticamente baseados na
        legislação vigente.
      </p>
    </div>

    <Card class="p-4">
      <template #title>
        <h5 class="font-medium mb-4 flex items-center gap-2">
          <i class="pi pi-file-edit"></i> Dados da Operação Fiscal
        </h5>
      </template>
      <template #content>
        <p class="text-sm text-surface-500 mb-4">
          Configure os dados necessários para o cálculo automático dos impostos
        </p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <div>
            <label
              for="productServiceType"
              class="block text-sm font-medium text-surface-700 mb-1"
              >Tipo de Produto/Serviço *</label
            >
            <Dropdown
              id="productServiceType"
              v-model="localFiscalOperationData.productServiceType"
              :options="productServiceTypeOptions"
              placeholder="Selecione o tipo"
              class="w-full"
            />
          </div>
          <div>
            <label
              for="operationType"
              class="block text-sm font-medium text-surface-700 mb-1"
              >Tipo de Operação Fiscal *</label
            >
            <Dropdown
              id="operationType"
              v-model="localFiscalOperationData.operationType"
              :options="['Compra', 'Venda']"
              placeholder="Selecione o tipo"
              class="w-full"
              :disabled="inferredOperationTypeDetails.confidence === 'high'"
            />
            <Message
              v-if="inferredOperationTypeDetails.confidence === 'ambiguous' || inferredOperationTypeDetails.confidence === 'low'"
              severity="warn"
              :closable="false"
              class="mt-2"
            >
              <div class="flex items-center">
                <i class="pi pi-exclamation-triangle mr-2"></i>
                <span>
                  A inferência do tipo de operação não é 100% confiável.
                  Por favor, revise e ajuste se necessário.
                </span>
              </div>
            </Message>
          </div>
          <div>
            <label for="ufOrigin" class="block text-sm font-medium text-surface-700 mb-1"
              ><i class="pi pi-map-marker mr-1"></i> UF de Origem *</label
            >
            <Dropdown
              id="ufOrigin"
              v-model="localFiscalOperationData.ufOrigin"
              :options="ufOptions"
              optionLabel="name"
              optionValue="code"
              placeholder="Selecione o estado..."
              class="w-full"
            />
          </div>
          <div>
            <label for="ufDestination" class="block text-sm font-medium text-surface-700 mb-1"
              ><i class="pi pi-map-marker mr-1"></i> UF de Destino *</label
            >
            <Dropdown
              id="ufDestination"
              v-model="localFiscalOperationData.ufDestination"
              :options="ufOptions"
              optionLabel="name"
              optionValue="code"
              placeholder="Selecione o estado..."
              class="w-full"
            />
          </div>
        </div>
        <div class="mt-4">
          <label for="cfop" class="block text-sm font-medium text-surface-700 mb-1"
            >CFOP - Código Fiscal de Operações e Prestações *</label
          >
          <Dropdown
            id="cfop"
            v-model="localFiscalOperationData.cfop"
            :options="cfopOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Selecione o CFOP..."
            class="w-full"
          />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          
          <div>
            <label for="freight" class="block text-sm font-medium text-surface-700 mb-1"
              ><i class="pi pi-truck mr-1"></i> Frete</label
            >
            <InputNumber
              id="freight"
              v-model="localFiscalOperationData.freight"
              mode="decimal"
              :min="0"
              :maxFractionDigits="2"
              class="w-full"
            />
          </div>
          <div>
            <label for="insurance" class="block text-sm font-medium text-surface-700 mb-1"
              ><i class="pi pi-shield mr-1"></i> Seguro</label
            >
            <InputNumber
              id="insurance"
              v-model="localFiscalOperationData.insurance"
              mode="decimal"
              :min="0"
              :maxFractionDigits="2"
              class="w-full"
            />
          </div>
          <div>
            <label for="discount" class="block text-sm font-medium text-surface-700 mb-1"
              ><i class="pi pi-percentage mr-1"></i> Desconto</label
            >
            <InputNumber
              id="discount"
              v-model="localFiscalOperationData.discount"
              mode="decimal"
              :min="0"
              :maxFractionDigits="2"
              class="w-full"
            />
          </div>
        </div>

        <p class="text-sm text-surface-500 mt-4">Calculado das partidas</p>

        <div class="flex items-center gap-6 mt-6">
          <div class="flex items-center gap-2">
            <InputSwitch v-model="localFiscalOperationData.icmsSt" id="icmsSt" />
            <label for="icmsSt" class="text-sm font-medium text-surface-700"
              >Substituição Tributária (ICMS-ST)</label
            >
          </div>
          <div class="flex items-center gap-2">
            <InputSwitch v-model="localFiscalOperationData.ipiIncides" id="ipiIncides" />
            <label for="ipiIncides" class="text-sm font-medium text-surface-700"
              >Incide IPI</label
            >
          </div>
          <div class="flex items-center gap-2">
            <InputSwitch v-model="localFiscalOperationData.industrialOperation" id="industrialOperation" />
            <label for="industrialOperation" class="text-sm font-medium text-surface-700"
              >Operação Industrial</label
            >
          </div>
        </div>

        <div class="flex justify-end mt-6">
          <Button label="Calcular Impostos" icon="pi pi-calculator" @click="calculateTaxes" />
        </div>

        <div v-if="validationErrors.length > 0" class="mt-6">
          <Message severity="error" :closable="false">
            <ul class="list-disc pl-5">
              <li v-for="error in validationErrors" :key="error">{{ error }}</li>
            </ul>
          </Message>
        </div>
      </template>
    </Card>

    <Card class="p-4" v-if="localFiscalOperationData.taxData">
      <template #title>
        <h5 class="font-medium mb-4 flex items-center gap-2">
          <i class="pi pi-calculator"></i> Impostos Calculados
        </h5>
      </template>
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div class="flex justify-between items-center">
            <span class="text-sm font-medium text-surface-700">ICMS:</span>
            <span class="text-sm text-surface-900">{{ localFiscalOperationData.taxData.calculated_icms_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm font-medium text-surface-700">IPI:</span>
            <span class="text-sm text-surface-900">{{ localFiscalOperationData.taxData.calculated_ipi_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm font-medium text-surface-700">PIS:</span>
            <span class="text-sm text-surface-900">{{ localFiscalOperationData.taxData.calculated_pis_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm font-medium text-surface-700">COFINS:</span>
            <span class="text-sm text-surface-900">{{ localFiscalOperationData.taxData.calculated_cofins_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm font-medium text-surface-700">IRRF:</span>
            <span class="text-sm text-surface-900">{{ localFiscalOperationData.taxData.calculated_irrf_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm font-medium text-surface-700">CSLL:</span>
            <span class="text-sm text-surface-900">{{ localFiscalOperationData.taxData.calculated_csll_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm font-medium text-surface-700">INSS:</span>
            <span class="text-sm text-surface-900">{{ localFiscalOperationData.taxData.calculated_inss_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm font-medium text-surface-700">ICMS-ST:</span>
            <span class="text-sm text-surface-900">{{ localFiscalOperationData.taxData.calculated_icms_st_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm font-medium text-surface-700">Total Líquido:</span>
            <span class="text-sm text-surface-900">{{ localFiscalOperationData.taxData.final_total_net.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}</span>
          </div>
        </div>
      </template>
    </Card>

    <!-- Seções de impostos (vendas, federais, retenções) podem ser adicionadas aqui, se necessário -->
    <!-- Por enquanto, o foco é na entrada de dados da operação fiscal -->
  </div>
</template>
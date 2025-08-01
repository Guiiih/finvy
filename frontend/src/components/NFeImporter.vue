<template>
  <div class="p-4 sm:p-4 md:p-6">
    <h2 class="text-xl font-semibold mb-3">Importar NF-e (XML)</h2>
    <div
      class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition duration-300 ease-in-out"
      @dragover.prevent="dragOver = true"
      @dragleave.prevent="dragOver = false"
      @drop.prevent="handleDrop"
      @click="openFilePicker"
      :class="{ 'border-blue-500 bg-blue-50': dragOver }"
    >
      <input type="file" ref="fileInput" @change="handleFileChange" accept=".xml" class="hidden" />
      <p class="text-gray-600">
        Arraste e solte seu arquivo XML da NF-e aqui, ou clique para selecionar.
      </p>
      <p class="text-sm text-gray-500 mt-1">Apenas arquivos .xml são aceitos.</p>
    </div>

    <div v-if="nfeLoading" class="mt-4 text-center text-blue-600">Processando XML...</div>

    <div v-if="nfeError" class="mt-4 text-red-500 text-center">
      {{ nfeError }}
    </div>

    <div v-if="extractedData" class="mt-6 p-4 border rounded-lg shadow-sm bg-white">
      <h3 class="text-lg font-semibold mb-3">Dados Extraídos da NF-e</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <p><strong>ID da NF-e:</strong> {{ extractedData.nfe_id }}</p>
          <p><strong>Data de Emissão:</strong> {{ formatDate(extractedData.emission_date) }}</p>
          <p><strong>Tipo:</strong> {{ extractedData.type === 'entrada' ? 'Entrada' : 'Saída' }}</p>
          <p>
            <strong>Regime Tributário da Organização:</strong>
            {{ formatRegime(extractedData.organization_tax_regime) }}
          </p>
        </div>
        <div>
          <p><strong>Emitente CNPJ:</strong> {{ extractedData.cnpj_emit }}</p>
          <p><strong>Emitente Razão Social:</strong> {{ extractedData.razao_social_emit }}</p>
          <p><strong>Emitente UF:</strong> {{ extractedData.uf_emit }}</p>
          <p><strong>Emitente Município:</strong> {{ extractedData.municipio_emit }}</p>
        </div>
        <div>
          <p><strong>Destinatário CNPJ:</strong> {{ extractedData.cnpj_dest }}</p>
          <p><strong>Destinatário Razão Social:</strong> {{ extractedData.razao_social_dest }}</p>
          <p><strong>Destinatário UF:</strong> {{ extractedData.uf_dest }}</p>
          <p><strong>Destinatário Município:</strong> {{ extractedData.municipio_dest }}</p>
        </div>
        <div>
          <p><strong>Total Produtos:</strong> {{ formatCurrency(extractedData.total_products) }}</p>
          <p><strong>Total NF-e:</strong> {{ formatCurrency(extractedData.total_nfe) }}</p>
          <p><strong>Total ICMS:</strong> {{ formatCurrency(extractedData.total_icms) }}</p>
          <p><strong>Total IPI:</strong> {{ formatCurrency(extractedData.total_ipi) }}</p>
          <p><strong>Total PIS:</strong> {{ formatCurrency(extractedData.total_pis) }}</p>
          <p><strong>Total COFINS:</strong> {{ formatCurrency(extractedData.total_cofins) }}</p>
        </div>
      </div>

      <h3 class="text-lg font-semibold mt-4 mb-2">Itens da NF-e</h3>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Descrição
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                NCM
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Qtd
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Vlr Unit.
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Vlr Total
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                ICMS
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                IPI
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                PIS
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                COFINS
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="item in extractedData.items" :key="item.ncm + item.description">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ item.description }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ item.ncm }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ item.quantity }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatCurrency(item.unit_value) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatCurrency(item.total_value) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatCurrency(item.icms_value) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatCurrency(item.ipi_value) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatCurrency(item.pis_value) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatCurrency(item.cofins_value) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex justify-end mt-6">
        <button
          @click="generateJournalEntry"
          :disabled="nfeLoading"
          class="px-4 py-2 bg-emerald-400 text-white rounded-md hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-50"
        >
          {{ nfeLoading ? 'Processando...' : 'Gerar Lançamento Contábil' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { api } from '@/services/api'
import { useToast } from 'primevue/usetoast'
import type { TaxRegime, NFeExtractedData } from '@/types'
import { getErrorMessage } from '@/utils/errorUtils'

const toast = useToast()
const emit = defineEmits(['nfe-processed'])

const fileInput = ref<HTMLInputElement | null>(null)
const dragOver = ref(false)
const nfeLoading = ref(false)
const nfeError = ref<string | null>(null)
const extractedData = ref<NFeExtractedData | null>(null)

const openFilePicker = () => {
  fileInput.value?.click()
}

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    processFile(target.files[0])
  }
}

const handleDrop = (event: DragEvent) => {
  dragOver.value = false
  if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
    processFile(event.dataTransfer.files[0])
  }
}

const processFile = async (file: File) => {
  if (file.type !== 'text/xml') {
    nfeError.value = 'Por favor, selecione um arquivo XML válido.'
    extractedData.value = null
    return
  }

  nfeLoading.value = true
  nfeError.value = null
  extractedData.value = null

  try {
    const reader = new FileReader()
    reader.onload = async (e) => {
      const xmlContent = e.target?.result as string
      try {
        const response = await api.post<{ message: string; data: NFeExtractedData }, string>(
          '/nfe-import',
          xmlContent
        )
        extractedData.value = response.data
        toast.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'XML da NF-e processado com sucesso!',
          life: 3000,
        })
      } catch (err: unknown) {
        nfeError.value = getErrorMessage(err)
        toast.add({ severity: 'error', summary: 'Erro', detail: nfeError.value, life: 3000 })
      } finally {
        nfeLoading.value = false
      }
    }
    reader.readAsText(file)
  } catch (err: unknown) {
    nfeError.value = getErrorMessage(err)
    nfeLoading.value = false
    toast.add({ severity: 'error', summary: 'Erro', detail: nfeError.value, life: 3000 })
  }
}

const generateJournalEntry = () => {
  if (!extractedData.value) return
  emit('nfe-processed', extractedData.value)
}

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('pt-BR')
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

const formatRegime = (regime: TaxRegime | null | undefined) => {
  if (!regime) return 'N/A'
  switch (regime) {
    case 'simples_nacional':
      return 'Simples Nacional'
    case 'lucro_presumido':
      return 'Lucro Presumido'
    case 'lucro_real':
      return 'Lucro Real'
    default:
      return regime
  }
}
</script>

<template>
  <div class="p-4 sm:p-4 md:p-6">
    <h1 class="text-2xl font-bold mb-4">Ferramentas Fiscais</h1>

    <!-- NFe Import Section -->
    <div class="mb-8">
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

      <div v-if="nfeLoading" class="mt-4 text-center text-blue-600">
        Processando XML...
      </div>

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
            <p><strong>Regime Tributário da Organização:</strong> {{ formatRegime(extractedData.organization_tax_regime) }}</p>
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
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NCM</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qtd</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vlr Unit.</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vlr Total</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ICMS</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IPI</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PIS</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">COFINS</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="item in extractedData.items" :key="item.ncm + item.description">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ item.description }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ item.ncm }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ item.quantity }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ formatCurrency(item.unit_value) }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ formatCurrency(item.total_value) }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ formatCurrency(item.icms_value) }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ formatCurrency(item.ipi_value) }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ formatCurrency(item.pis_value) }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ formatCurrency(item.cofins_value) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex justify-end mt-6">
          <button
            @click="confirmImport"
            :disabled="nfeLoading"
            class="px-4 py-2 bg-emerald-400 text-white rounded-md hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-50"
          >
            {{ nfeLoading ? 'Importando...' : 'Confirmar Importação' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Tax Simulator Section -->
    <div class="mt-8">
      <h2 class="text-xl font-semibold mb-3">Simulador de Impostos</h2>
      <div class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6" role="alert">
        <p class="font-bold">Atenção:</p>
        <p>Esta é uma ferramenta de simulação. Os cálculos são estimativas e não consideram benefícios fiscais ou regras específicas. Consulte sempre um contador.</p>
      </div>

      <div class="bg-white p-4 rounded-lg shadow-sm">
        <h3 class="text-xl font-semibold mb-3">Dados da Operação</h3>
        <form @submit.prevent="simulateTaxes" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="operationDate" class="block text-sm font-medium text-gray-700">Data da Operação</label>
            <input
              type="date"
              id="operationDate"
              v-model="operationDate"
              @change="fetchRegimeForDate"
              required
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </div>
          <div>
            <label for="currentRegime" class="block text-sm font-medium text-gray-700">Regime Tributário da Sua Empresa (na data da operação)</label>
            <input
              type="text"
              id="currentRegime"
              :value="formatRegime(organizationTaxRegime?.regime)"
              disabled
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 cursor-not-allowed"
            />
            <p v-if="!organizationTaxRegime && operationDate" class="text-red-500 text-xs mt-1">Nenhum regime tributário encontrado para a data selecionada.</p>
          </div>

          <div>
            <label for="operationType" class="block text-sm font-medium text-gray-700">Tipo de Operação</label>
            <select
              id="operationType"
              v-model="operationType"
              required
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            >
              <option value="compra">Compra</option>
              <option value="venda">Venda</option>
            </select>
          </div>

          <div>
            <label for="originUF" class="block text-sm font-medium text-gray-700">UF de Origem</label>
            <select
              id="originUF"
              v-model="originUF"
              required
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            >
              <option v-for="uf in ufs" :key="uf" :value="uf">{{ uf }}</option>
            </select>
          </div>

          <div>
            <label for="destinationUF" class="block text-sm font-medium text-gray-700">UF de Destino</label>
            <select
              id="destinationUF"
              v-model="destinationUF"
              required
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            >
              <option v-for="uf in ufs" :key="uf" :value="uf">{{ uf }}</option>
            </select>
          </div>

          <div>
            <label for="productValue" class="block text-sm font-medium text-gray-700">Valor dos Produtos</label>
            <input
              type="number"
              id="productValue"
              v-model.number="productValue"
              required
              min="0"
              step="0.01"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </div>

          <div>
            <label for="freightValue" class="block text-sm font-medium text-gray-700">Valor do Frete</label>
            <input
              type="number"
              id="freightValue"
              v-model.number="freightValue"
              min="0"
              step="0.01"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </div>

          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700">A operação envolve produtos com Substituição Tributária (ICMS-ST)?</label>
            <div class="mt-1">
              <label class="inline-flex items-center mr-4">
                <input type="radio" v-model="hasICMSST" :value="true" class="form-radio" />
                <span class="ml-2">Sim</span>
              </label>
              <label class="inline-flex items-center">
                <input type="radio" v-model="hasICMSST" :value="false" class="form-radio" />
                <span class="ml-2">Não</span>
              </label>
            </div>
          </div>

          <div v-if="hasICMSST" class="md:col-span-2">
            <label for="mvaPercentage" class="block text-sm font-medium text-gray-700">MVA (%)</label>
            <input
              type="number"
              id="mvaPercentage"
              v-model.number="mvaPercentage"
              min="0"
              step="0.01"
              required
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </div>

          <div class="md:col-span-2 flex justify-end">
            <button
              type="submit"
              :disabled="simLoading || !operationDate || !organizationTaxRegime"
              class="px-4 py-2 bg-emerald-400 text-white rounded-md hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-50"
            >
              {{ simLoading ? 'Calculando...' : 'Simular Impostos' }}
            </button>
          </div>
        </form>

        <div v-if="simulationResult" class="mt-6 p-4 border rounded-lg shadow-sm bg-gray-50">
          <h3 class="text-xl font-semibold mb-3">Resultado da Simulação</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Base de Cálculo ICMS:</strong> {{ formatCurrency(simulationResult.baseCalculoICMS) }}</p>
              <p><strong>Alíquota ICMS Interestadual Sugerida:</strong> {{ simulationResult.aliquotaICMSInterestadual * 100 }}%</p>
              <p><strong>Valor ICMS:</strong> {{ formatCurrency(simulationResult.valorICMS) }}</p>
              <p v-if="simulationResult.valorICMSST"><strong>Valor ICMS-ST:</strong> {{ formatCurrency(simulationResult.valorICMSST) }}</p>
            </div>
            <div>
              <p><strong>Base de Cálculo PIS/COFINS:</strong> {{ formatCurrency(simulationResult.baseCalculoPISCOFINS) }}</p>
              <p><strong>Valor PIS:</strong> {{ formatCurrency(simulationResult.valorPIS) }}</p>
              <p><strong>Valor COFINS:</strong> {{ formatCurrency(simulationResult.valorCOFINS) }}</p>
            </div>
          </div>

          <h4 class="text-lg font-semibold mt-4 mb-2">Detalhes do Cálculo:</h4>
          <ul class="list-disc list-inside text-sm text-gray-700">
            <li v-for="detail in simulationResult.calculationDetails" :key="detail">{{ detail }}</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { api } from '@/services/api';
import { useToast } from 'primevue/usetoast';
import type { TaxRegime, TaxRegimeHistory } from '@/types';
import { useAuthStore } from '@/stores/authStore';

const authStore = useAuthStore();
const toast = useToast();

// NFe Import State
interface NFeExtractedData {
  nfe_id: string;
  emission_date: string;
  type: 'entrada' | 'saida';
  cnpj_emit: string;
  razao_social_emit: string;
  uf_emit: string;
  municipio_emit: string;
  cnpj_dest: string;
  razao_social_dest: string;
  uf_dest: string;
  municipio_dest: string;
  total_products: number;
  total_nfe: number;
  total_icms: number;
  total_ipi: number;
  total_pis: number;
  total_cofins: number;
  organization_tax_regime: TaxRegime | null;
  items: Array<{
    description: string;
    ncm: string;
    quantity: number;
    unit_value: number;
    total_value: number;
    icms_value: number;
    ipi_value: number;
    pis_value: number;
    cofins_value: number;
  }>;
}

const fileInput = ref<HTMLInputElement | null>(null);
const dragOver = ref(false);
const nfeLoading = ref(false); // Renamed to avoid conflict
const nfeError = ref<string | null>(null); // Renamed to avoid conflict
const extractedData = ref<NFeExtractedData | null>(null);

const openFilePicker = () => {
  fileInput.value?.click();
};

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    processFile(target.files[0]);
  }
};

const handleDrop = (event: DragEvent) => {
  dragOver.value = false;
  if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
    processFile(event.dataTransfer.files[0]);
  }
};

const processFile = async (file: File) => {
  if (file.type !== 'text/xml') {
    nfeError.value = 'Por favor, selecione um arquivo XML válido.';
    extractedData.value = null;
    return;
  }

  nfeLoading.value = true;
  nfeError.value = null;
  extractedData.value = null;

  try {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const xmlContent = e.target?.result as string;
      try {
        const response = await api.post<{ message: string; data: NFeExtractedData }, string>('/nfe-import', xmlContent, {
          headers: {
            'Content-Type': 'application/xml',
          },
        });
        extractedData.value = response.data;
        toast.add({ severity: 'success', summary: 'Sucesso', detail: 'XML da NF-e processado com sucesso!', life: 3000 });
      } catch (err: any) {
        nfeError.value = err.response?.data?.message || err.message || 'Erro ao processar o XML no servidor.';
        toast.add({ severity: 'error', summary: 'Erro', detail: nfeError.value, life: 3000 });
      } finally {
        nfeLoading.value = false;
      }
    };
    reader.readAsText(file);
  } catch (err: any) {
    nfeError.value = err.message || 'Erro ao ler o arquivo.';
    nfeLoading.value = false;
    toast.add({ severity: 'error', summary: 'Erro', detail: nfeError.value, life: 3000 });
  }
};

const confirmImport = async () => {
  if (!extractedData.value) return;

  nfeLoading.value = true;
  nfeError.value = null;

  try {
    // TODO: Implementar a lógica de salvamento dos dados extraídos no banco de dados
    // Por enquanto, apenas um placeholder
    console.log('Dados para importação:', extractedData.value);
    toast.add({ severity: 'success', summary: 'Importação Confirmada', detail: 'Dados da NF-e prontos para serem salvos (funcionalidade em desenvolvimento). ', life: 5000 });
  } catch (err: any) {
    nfeError.value = err.message || 'Erro ao confirmar a importação.';
    toast.add({ severity: 'error', summary: 'Erro', detail: nfeError.value, life: 3000 });
  } finally {
    nfeLoading.value = false;
  }
};

// Tax Simulator State
const operationDate = ref<string | null>(null);
const organizationTaxRegime = ref<TaxRegimeHistory | null>(null);
const operationType = ref<'compra' | 'venda'>('compra');
const originUF = ref('SP');
const destinationUF = ref('MG');
const productValue = ref(0);
const freightValue = ref(0);
const hasICMSST = ref(false);
const mvaPercentage = ref(0);

const simLoading = ref(false); // Renamed to avoid conflict
const simError = ref<string | null>(null); // Renamed to avoid conflict
const simulationResult = ref<any | null>(null);

const ufs = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const icmsInterstateRates: { [key: string]: { [key: string]: number } } = {
  'AC': { 'RO': 0.07, 'RR': 0.07, 'AM': 0.07, 'PA': 0.07, 'AP': 0.07, 'TO': 0.07, 'MA': 0.07, 'PI': 0.07, 'CE': 0.07, 'RN': 0.07, 'PB': 0.07, 'PE': 0.07, 'AL': 0.07, 'SE': 0.07, 'BA': 0.07, 'MG': 0.07, 'ES': 0.07, 'RJ': 0.07, 'SP': 0.12, 'PR': 0.12, 'SC': 0.12, 'RS': 0.12, 'MS': 0.07, 'MT': 0.07, 'DF': 0.07 },
  'AL': { 'RO': 0.07, 'RR': 0.07, 'AM': 0.07, 'PA': 0.07, 'AP': 0.07, 'TO': 0.07, 'MA': 0.07, 'PI': 0.07, 'CE': 0.07, 'RN': 0.07, 'PB': 0.07, 'PE': 0.07, 'AL': 0.07, 'SE': 0.07, 'BA': 0.07, 'MG': 0.07, 'ES': 0.07, 'RJ': 0.07, 'SP': 0.12, 'PR': 0.12, 'SC': 0.12, 'RS': 0.12, 'MS': 0.07, 'MT': 0.07, 'DF': 0.07 },
  'AP': { 'RO': 0.07, 'RR': 0.07, 'AM': 0.07, 'PA': 0.07, 'AP': 0.07, 'TO': 0.07, 'MA': 0.07, 'PI': 0.07, 'CE': 0.07, 'RN': 0.07, 'PB': 0.07, 'PE': 0.07, 'AL': 0.07, 'SE': 0.07, 'BA': 0.07, 'MG': 0.07, 'ES': 0.07, 'RJ': 0.07, 'SP': 0.12, 'PR': 0.12, 'SC': 0.12, 'RS': 0.12, 'MS': 0.07, 'MT': 0.07, 'DF': 0.07 },
  'AM': { 'RO': 0.07, 'RR': 0.07, 'AM': 0.07, 'PA': 0.07, 'AP': 0.07, 'TO': 0.07, 'MA': 0.07, 'PI': 0.07, 'CE': 0.07, 'RN': 0.07, 'PB': 0.07, 'PE': 0.07, 'AL': 0.07, 'SE': 0.07, 'BA': 0.07, 'MG': 0.07, 'ES': 0.07, 'RJ': 0.07, 'SP': 0.12, 'PR': 0.12, 'SC': 0.12, 'RS': 0.12, 'MS': 0.07, 'MT': 0.07, 'DF': 0.07 },
  'BA': { 'RO': 0.07, 'RR': 0.07, 'AM': 0.07, 'PA': 0.07, 'AP': 0.07, 'TO': 0.07, 'MA': 0.07, 'PI': 0.07, 'CE': 0.07, 'RN': 0.07, 'PB': 0.07, 'PE': 0.07, 'AL': 0.07, 'SE': 0.07, 'BA': 0.07, 'MG': 0.07, 'ES': 0.07, 'RJ': 0.07, 'SP': 0.12, 'PR': 0.12, 'SC': 0.12, 'RS': 0.12, 'MS': 0.07, 'MT': 0.07, 'DF': 0.07 },
  'CE': { 'RO': 0.07, 'RR': 0.07, 'AM': 0.07, 'PA': 0.07, 'AP': 0.07, 'TO': 0.07, 'MA': 0.07, 'PI': 0.07, 'CE': 0.07, 'RN': 0.07, 'PB': 0.07, 'PE': 0.07, 'AL': 0.07, 'SE': 0.07, 'BA': 0.07, 'MG': 0.07, 'ES': 0.07, 'RJ': 0.07, 'SP': 0.12, 'PR': 0.12, 'SC': 0.12, 'RS': 0.12, 'MS': 0.07, 'MT': 0.07, 'DF': 0.07 },
  'DF': { 'RO': 0.07, 'RR': 0.07, 'AM': 0.07, 'PA': 0.07, 'AP': 0.07, 'TO': 0.07, 'MA': 0.07, 'PI': 0.07, 'CE': 0.07, 'RN': 0.07, 'PB': 0.07, 'PE': 0.07, 'AL': 0.07, 'SE': 0.07, 'BA': 0.07, 'MG': 0.07, 'ES': 0.07, 'RJ': 0.07, 'SP': 0.12, 'PR': 0.12, 'SC': 0.12, 'RS': 0.12, 'MS': 0.07, 'MT': 0.07, 'DF': 0.07 },
  'ES': { 'RO': 0.07, 'RR': 0.07, 'AM': 0.07, 'PA': 0.07, 'AP': 0.07, 'TO': 0.07, 'MA': 0.07, 'PI': 0.07, 'CE': 0.07, 'RN': 0.07, 'PB': 0.07, 'PE': 0.07, 'AL': 0.07, 'SE': 0.07, 'BA': 0.07, 'MG': 0.07, 'ES': 0.07, 'RJ': 0.07, 'SP': 0.12, 'PR': 0.12, 'SC': 0.12, 'RS': 0.12, 'MS': 0.07, 'MT': 0.07, 'DF': 0.07 },
  'GO': { 'RO': 0.07, 'RR': 0.07, 'AM': 0.07, 'PA': 0.07, 'AP': 0.07, 'TO': 0.07, 'MA': 0.07, 'PI': 0.07, 'CE': 0.07, 'RN': 0.07, 'PB': 0.07, 'PE': 0.07, 'AL': 0.07, 'SE': 0.07, 'BA': 0.07, 'MG': 0.07, 'ES': 0.07, 'RJ': 0.07, 'SP': 0.12, 'PR': 0.12, 'SC': 0.12, 'RS': 0.12, 'MS': 0.07, 'MT': 0.07, 'DF': 0.07 },
  'MA': { 'RO': 0.07, 'RR': 0.07, 'AM': 0.07, 'PA': 0.07, 'AP': 0.07, 'TO': 0.07, 'MA': 0.07, 'PI': 0.07, 'CE': 0.07, 'RN': 0.07, 'PB': 0.07, 'PE': 0.07, 'AL': 0.07, 'SE': 0.07, 'BA': 0.07, 'MG': 0.07, 'ES': 0.07, 'RJ': 0.07, 'SP': 0.12, 'PR': 0.12, 'SC': 0.12, 'RS': 0.12, 'MS': 0.07, 'MT': 0.07, 'DF': 0.07 },
  'MT': { 'RO': 0.07, 'RR': 0.07, 'AM': 0.07, 'PA': 0.07, 'AP': 0.07, 'TO': 0.07, 'MA': 0.07, 'PI': 0.07, 'CE': 0.07, 'RN': 0.07, 'PB': 0.07, 'PE': 0.07, 'AL': 0.07, 'SE': 0.07, 'BA': 0.07, 'MG': 0.07, 'ES': 0.07, 'RJ': 0.07, 'SP': 0.12, 'PR': 0.12, 'SC': 0.12, 'RS': 0.12, 'MS': 0.07, 'MT': 0.07, 'DF': 0.07 },
  'MS': { 'RO': 0.07, 'RR': 0.07, 'AM': 0.07, 'PA': 0.07, 'AP': 0.07, 'TO': 0.07, 'MA': 0.07, 'PI': 0.07, 'CE': 0.07, 'RN': 0.07, 'PB': 0.07, 'PE': 0.07, 'AL': 0.07, 'SE': 0.07, 'BA': 0.07, 'MG': 0.07, 'ES': 0.07, 'RJ': 0.07, 'SP': 0.12, 'PR': 0.12, 'SC': 0.12, 'RS': 0.12, 'MS': 0.07, 'MT': 0.07, 'DF': 0.07 },
  'MG': { 'RO': 0.07, 'RR': 0.07, 'AM': 0.07, 'PA': 0.07, 'AP': 0.07, 'TO': 0.07, 'MA': 0.07, 'PI': 0.07, 'CE': 0.07, 'RN': 0.07, 'PB': 0.07, 'PE': 0.07, 'AL': 0.07, 'SE': 0.07, 'BA': 0.07, 'MG': 0.07, 'ES': 0.07, 'RJ': 0.07, 'SP': 0.12, 'PR': 0.12, 'SC': 0.12, 'RS': 0.12, 'MS': 0.07, 'MT': 0.07, 'DF': 0.07 },
  'PA': { 'RO': 0.07, 'RR': 0.07, 'AM': 0.07, 'PA': 0.07, 'AP': 0.07, 'TO': 0.07, 'MA': 0.07, 'PI': 0.07, 'CE': 0.07, 'RN': 0.07, 'PB': 0.07, 'PE': 0.07, 'AL': 0.07, 'SE': 0.07, 'BA': 0.07, 'MG': 0.07, 'ES': 0.07, 'RJ': 0.07, 'SP': 0.12, 'PR': 0.12, 'SC': 0.12, 'RS': 0.12, 'MS': 0.07, 'MT': 0.07, 'DF': 0.07 },
  'PB': { 'RO': 0.07, 'RR': 0.07, 'AM': 0.07, 'PA': 0.07, 'AP': 0.07, 'TO': 0.07, 'MA': 0.07, 'PI': 0.07, 'CE': 0.07, 'RN': 0.07, 'PB': 0.07, 'PE': 0.07, 'AL': 0.07, 'SE': 0.07, 'BA': 0.07, 'MG': 0.07, 'ES': 0.07, 'RJ': 0.07, 'SP': 0.12, 'PR': 0.12, 'SC': 0.12, 'RS': 0.12, 'MS': 0.07, 'MT': 0.07, 'DF': 0.07 },
  'PR': { 'RO': 0.07, 'RR': 0.07, 'AM': 0.07, 'PA': 0.07, 'AP': 0.07, 'TO': 0.07, 'MA': 0.07, 'PI': 0.07, 'CE': 0.07, 'RN': 0.07, 'PB': 0.07, 'PE': 0.07, 'AL': 0.07, 'SE': 0.07, 'BA': 0.07, 'MG': 0.07, 'ES': 0.07, 'RJ': 0.07, 'SP': 0.12, 'PR': 0.12, 'SC': 0.12, 'RS': 0.12, 'MS': 0.07, 'MT': 0.07, 'DF': 0.07 },
  'PE': { 'RO': 0.07, 'RR': 0.07, 'AM': 0.07, 'PA': 0.07, 'AP': 0.07, 'TO': 0.07, 'MA': 0.07, 'PI': 0.07, 'CE': 0.07, 'RN': 0.07, 'PB': 0.07, 'PE': 0.07, 'AL': 0.07, 'SE': 0.07, 'BA': 0.07, 'MG': 0.07, 'ES': 0.07, 'RJ': 0.07, 'SP': 0.12, 'PR': 0.12, 'SC': 0.12, 'RS': 0.12, 'MS': 0.07, 'MT': 0.07, 'DF': 0.07 },
  'PI': { 'RO': 0.07, 'RR': 0.07, 'AM': 0.07, 'PA': 0.07, 'AP': 0.07, 'TO': 0.07, 'MA': 0.07, 'PI': 0.07, 'CE': 0.07, 'RN': 0.07, 'PB': 0.07, 'PE': 0.07, 'AL': 0.07, 'SE': 0.07, 'BA': 0.07, 'MG': 0.07, 'ES': 0.07, 'RJ': 0.07, 'SP': 0.12, 'PR': 0.12, 'SC': 0.12, 'RS': 0.12, 'MS': 0.07, 'MT': 0.07, 'DF': 0.07 },
  'RJ': { 'RO': 0.07, 'RR': 0.07, 'AM': 0.07, 'PA': 0.07, 'AP': 0.07, 'TO': 0.07, 'MA': 0.07, 'PI': 0.07, 'CE': 0.07, 'RN': 0.07, 'PB': 0.07, 'PE': 0.07, 'AL': 0.07, 'SE': 0.07, 'BA': 0.07, 'MG': 0.07, 'ES': 0.07, 'RJ': 0.07, 'SP': 0.12, 'PR': 0.12, 'SC': 0.12, 'RS': 0.12, 'MS': 0.07, 'MT': 0.07, 'DF': 0.07 },
  'RN': { 'RO': 0.07, 'RR': 0.07, 'AM': 0.07, 'PA': 0.07, 'AP': 0.07, 'TO': 0.07, 'MA': 0.07, 'PI': 0.07, 'CE': 0.07, 'RN': 0.07, 'PB': 0.07, 'PE': 0.07, 'AL': 0.07, 'SE': 0.07, 'BA': 0.07, 'MG': 0.07, 'ES': 0.07, 'RJ': 0.07, 'SP': 0.12, 'PR': 0.12, 'SC': 0.12, 'RS': 0.12, 'MS': 0.07, 'MT': 0.07, 'DF': 0.07 },
  'RS': { 'RO': 0.07, 'RR': 0.07, 'AM': 0.07, 'PA': 0.07, 'AP': 0.07, 'TO': 0.07, 'MA': 0.07, 'PI': 0.07, 'CE': 0.07, 'RN': 0.07, 'PB': 0.07, 'PE': 0.07, 'AL': 0.07, 'SE': 0.07, 'BA': 0.07, 'MG': 0.07, 'ES': 0.07, 'RJ': 0.07, 'SP': 0.12, 'PR': 0.12, 'SC': 0.12, 'RS': 0.12, 'MS': 0.07, 'MT': 0.07, 'DF': 0.07 },
  'RO': { 'RO': 0.07, 'RR': 0.07, 'AM': 0.07, 'PA': 0.07, 'AP': 0.07, 'TO': 0.07, 'MA': 0.07, 'PI': 0.07, 'CE': 0.07, 'RN': 0.07, 'PB': 0.07, 'PE': 0.07, 'AL': 0.07, 'SE': 0.07, 'BA': 0.07, 'MG': 0.07, 'ES': 0.07, 'RJ': 0.07, 'SP': 0.12, 'PR': 0.12, 'SC': 0.12, 'RS': 0.12, 'MS': 0.07, 'MT': 0.07, 'DF': 0.07 },
  'RR': { 'RO': 0.07, 'RR': 0.07, 'AM': 0.07, 'PA': 0.07, 'AP': 0.07, 'TO': 0.07, 'MA': 0.07, 'PI': 0.07, 'CE': 0.07, 'RN': 0.07, 'PB': 0.07, 'PE': 0.07, 'AL': 0.07, 'SE': 0.07, 'BA': 0.07, 'MG': 0.07, 'ES': 0.07, 'RJ': 0.07, 'SP': 0.12, 'PR': 0.12, 'SC': 0.12, 'RS': 0.12, 'MS': 0.07, 'MT': 0.07, 'DF': 0.07 },
  'SC': { 'RO': 0.07, 'RR': 0.07, 'AM': 0.07, 'PA': 0.07, 'AP': 0.07, 'TO': 0.07, 'MA': 0.07, 'PI': 0.07, 'CE': 0.07, 'RN': 0.07, 'PB': 0.07, 'PE': 0.07, 'AL': 0.07, 'SE': 0.07, 'BA': 0.07, 'MG': 0.07, 'ES': 0.07, 'RJ': 0.07, 'SP': 0.12, 'PR': 0.12, 'SC': 0.12, 'RS': 0.12, 'MS': 0.07, 'MT': 0.07, 'DF': 0.07 },
  'SP': { 'RO': 0.07, 'RR': 0.07, 'AM': 0.07, 'PA': 0.07, 'AP': 0.07, 'TO': 0.07, 'MA': 0.07, 'PI': 0.07, 'CE': 0.07, 'RN': 0.07, 'PB': 0.07, 'PE': 0.07, 'AL': 0.07, 'SE': 0.07, 'BA': 0.07, 'MG': 0.07, 'ES': 0.07, 'RJ': 0.07, 'SP': 0.12, 'PR': 0.12, 'SC': 0.12, 'RS': 0.12, 'MS': 0.07, 'MT': 0.07, 'DF': 0.07 },
  'SE': { 'RO': 0.07, 'RR': 0.07, 'AM': 0.07, 'PA': 0.07, 'AP': 0.07, 'TO': 0.07, 'MA': 0.07, 'PI': 0.07, 'CE': 0.07, 'RN': 0.07, 'PB': 0.07, 'PE': 0.07, 'AL': 0.07, 'SE': 0.07, 'BA': 0.07, 'MG': 0.07, 'ES': 0.07, 'RJ': 0.07, 'SP': 0.12, 'PR': 0.12, 'SC': 0.12, 'RS': 0.12, 'MS': 0.07, 'MT': 0.07, 'DF': 0.07 },
  'TO': { 'RO': 0.07, 'RR': 0.07, 'AM': 0.07, 'PA': 0.07, 'AP': 0.07, 'TO': 0.07, 'MA': 0.07, 'PI': 0.07, 'CE': 0.07, 'RN': 0.07, 'PB': 0.07, 'PE': 0.07, 'AL': 0.07, 'SE': 0.07, 'BA': 0.07, 'MG': 0.07, 'ES': 0.07, 'RJ': 0.07, 'SP': 0.12, 'PR': 0.12, 'SC': 0.12, 'RS': 0.12, 'MS': 0.07, 'MT': 0.07, 'DF': 0.07 },
};

const icmsImportedRate = 0.04; // 4% para produtos importados

async function fetchRegimeForDate() {
  if (!operationDate.value) {
    organizationTaxRegime.value = null;
    return;
  }

  simLoading.value = true;
  simError.value = null;
  try {
    const regimes = await api.get<TaxRegimeHistory[]>('/tax-regime-history');
    const opDate = new Date(operationDate.value);

    const foundRegime = regimes.find(regime => {
      const startDate = new Date(regime.start_date);
      const endDate = new Date(regime.end_date);
      return opDate >= startDate && opDate <= endDate;
    });
    organizationTaxRegime.value = foundRegime || null;
  } catch (err: any) {
    console.error('Erro ao buscar regime tributário para a data:', err);
    simError.value = err.message || 'Falha ao buscar regime tributário.';
    organizationTaxRegime.value = null;
  } finally {
    simLoading.value = false;
  }
}

const simulateTaxes = () => {
  simulationResult.value = null;
  simError.value = null;

  if (!organizationTaxRegime.value) {
    simError.value = 'Selecione uma data de operação válida com um regime tributário definido para a organização.';
    return;
  }

  const details: string[] = [];
  let baseCalculoICMS = productValue.value + freightValue.value;
  let aliquotaICMSInterestadual = 0;
  let valorICMS = 0;
  let valorICMSST = 0;
  let baseCalculoPISCOFINS = productValue.value;
  let valorPIS = 0;
  let valorCOFINS = 0;

  details.push(`Valor dos Produtos: ${formatCurrency(productValue.value)}`);
  details.push(`Valor do Frete: ${formatCurrency(freightValue.value)}`);
  details.push(`Regime Tributário da Organização: ${formatRegime(organizationTaxRegime.value.regime)}`);

  // Cálculo do ICMS
  if (originUF.value === destinationUF.value) {
    details.push('Operação interna (mesma UF de origem e destino). ICMS será calculado com alíquota interna (não simulada aqui).');
  } else {
    aliquotaICMSInterestadual = icmsInterstateRates[originUF.value]?.[destinationUF.value] || icmsImportedRate; // Simplificação: usa 4% se não encontrar
    valorICMS = baseCalculoICMS * aliquotaICMSInterestadual;
    details.push(`Base de Cálculo ICMS: ${formatCurrency(baseCalculoICMS)}`);
    details.push(`Alíquota ICMS Interestadual Sugerida: ${aliquotaICMSInterestadual * 100}% (baseada na tabela interna de alíquotas).`);
    details.push(`Valor ICMS: ${formatCurrency(valorICMS)}`);
  }

  // Cálculo do ICMS-ST
  if (hasICMSST.value && mvaPercentage.value > 0) {
    const mvaDecimal = mvaPercentage.value / 100;
    const baseCalculoICMSST = baseCalculoICMS * (1 + mvaDecimal);
    // Para simplificação, assumimos uma alíquota interna padrão para o cálculo do ICMS-ST
    // Em um cenário real, a alíquota interna do destino seria necessária.
    const aliquotaInternaFicticia = 0.18; // Exemplo: 18%
    valorICMSST = (baseCalculoICMSST * aliquotaInternaFicticia) - valorICMS;
    details.push(`Operação com ICMS-ST. MVA aplicada: ${mvaPercentage.value}%.`);
    details.push(`Base de Cálculo ICMS-ST: ${formatCurrency(baseCalculoICMSST)} (Base ICMS * (1 + MVA)).`);
    details.push(`Alíquota Interna Fictícia para ST: ${aliquotaInternaFicticia * 100}%.`);
    details.push(`Valor ICMS-ST: ${formatCurrency(valorICMSST)} (ICMS-ST = (Base ST * Alíquota Interna) - ICMS Próprio).`);
  }

  // Cálculo de PIS/COFINS (simplificado)
  // Para Simples Nacional, PIS/COFINS são calculados sobre a receita bruta total da empresa, não por operação.
  // Para Lucro Presumido/Real, as alíquotas são fixas sobre a receita/faturamento.
  if (organizationTaxRegime.value.regime === 'lucro_presumido' || organizationTaxRegime.value.regime === 'lucro_real') {
    const aliquotaPIS = 0.0065; // 0.65% para Lucro Presumido (cumulativo)
    const aliquotaCOFINS = 0.03; // 3% para Lucro Presumido (cumulativo)

    valorPIS = baseCalculoPISCOFINS * aliquotaPIS;
    valorCOFINS = baseCalculoPISCOFINS * aliquotaCOFINS;
    details.push(`Base de Cálculo PIS/COFINS: ${formatCurrency(baseCalculoPISCOFINS)} (Valor dos Produtos).`);
    details.push(`Alíquota PIS (cumulativo): ${aliquotaPIS * 100}%.`);
    details.push(`Alíquota COFINS (cumulativo): ${aliquotaCOFINS * 100}%.`);
    details.push(`Valor PIS: ${formatCurrency(valorPIS)}.`);
    details.push(`Valor COFINS: ${formatCurrency(valorCOFINS)}.`);
  } else if (organizationTaxRegime.value.regime === 'simples_nacional') {
    details.push('Para Simples Nacional, PIS/COFINS são calculados sobre a receita bruta total da empresa, não por operação individual. Não simulado aqui.');
  }

  simulationResult.value = {
    baseCalculoICMS,
    aliquotaICMSInterestadual,
    valorICMS,
    valorICMSST: hasICMSST.value ? valorICMSST : undefined,
    baseCalculoPISCOFINS,
    valorPIS,
    valorCOFINS,
    calculationDetails: details,
  };
};

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formatRegime = (regime: TaxRegime | null | undefined) => {
  if (!regime) return 'N/A';
  switch (regime) {
    case 'simples_nacional':
      return 'Simples Nacional';
    case 'lucro_presumido':
      return 'Lucro Presumido';
    case 'lucro_real':
      return 'Lucro Real';
    default:
      return regime;
  }
};
</script>

<script setup lang="ts">
import { ref } from 'vue'

// Static data to populate the UI, mirroring the image content
const selectedProduct = ref('Smartphone Samsung Galaxy S24 (SM-S24-12E)')
const evaluationMethod = ref('Custo Médio Ponderado')

const summary = {
  finalStock: 8,
  stockValue: 20000.00,
  averageCost: 2500.00,
  totalEntries: 3,
}

const movements = ref([
  {
    date: '30/06/2025',
    type: 'Entrada',
    description: 'Compra inicial',
    qty: 10,
    unitCost: 'R$ 2.500,00',
    total: 'R$ 25.000,00',
    stock: 10,
    stockValue: 'R$ 25.000,00',
    averageCost: 'R$ 2.500,00'
  },
  {
    date: '04/07/2025',
    type: 'Entrada',
    description: 'Reposição estoque',
    qty: 5,
    unitCost: 'R$ 2.600,00',
    total: 'R$ 13.000,00',
    stock: 15,
    stockValue: 'R$ 38.000,00',
    averageCost: 'R$ 2.533,33'
  },
  {
    date: '09/07/2025',
    type: 'Saída',
    description: 'Venda cliente A',
    qty: 3,
    unitCost: 'R$ 2.533,33',
    total: 'R$ 7.600,00',
    stock: 12,
    stockValue: 'R$ 30.400,00',
    averageCost: 'R$ 2.533,33'
  },
    {
    date: '14/07/2025',
    type: 'Entrada',
    description: 'Nova aquisição',
    qty: 8,
    unitCost: 'R$ 2.450,00',
    total: 'R$ 19.600,00',
    stock: 20,
    stockValue: 'R$ 50.000,00',
    averageCost: 'R$ 2.500,00'
  },
  {
    date: '19/07/2025',
    type: 'Saída',
    description: 'Venda cliente B',
    qty: 5,
    unitCost: 'R$ 2.500,00',
    total: 'R$ 12.500,00',
    stock: 15,
    stockValue: 'R$ 37.500,00',
    averageCost: 'R$ 2.500,00'
  },
  {
    date: '24/07/2025',
    type: 'Saída',
    description: 'Venda cliente C',
    qty: 7,
    unitCost: 'R$ 2.500,00',
    total: 'R$ 17.500,00',
    stock: 8,
    stockValue: 'R$ 20.000,00',
    averageCost: 'R$ 2.500,00'
  }
])
</script>

<template>
  <div class="bg-gray-50/50 min-h-screen p-4 sm:p-8 font-sans">
    <div class="max-w-7xl mx-auto">
      <header class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-800">Controle de Estoque</h1>
        <p class="text-gray-500 mt-1">Sistema completo de controle de estoque com avaliação por PEPS, UEPS e Custo Médio.</p>
      </header>

      <section class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-200/80">
          <div class="flex items-center text-gray-600 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7l8 4" />
            </svg>
            <h3 class="font-semibold">Produto Selecionado</h3>
          </div>
          <select v-model="selectedProduct" class="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400 text-gray-700">
            <option>{{ selectedProduct }}</option>
          </select>
        </div>

        <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-200/80">
          <div class="flex items-center text-gray-600 mb-3">
             <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 class="font-semibold">Método de Avaliação</h3>
          </div>
          <select v-model="evaluationMethod" class="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400 text-gray-700 bg-gray-50">
            <option>{{ evaluationMethod }}</option>
          </select>
        </div>

        <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-200/80">
           <div class="flex items-center text-gray-600 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 003 0m-3 0h.01M12 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 003 0m-3 0h.01M17 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 003 0m-3 0h.01" />
            </svg>
            <h3 class="font-semibold">Ações</h3>
          </div>
          <div class="flex flex-col space-y-2">
            <button class="w-full bg-gray-800 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors duration-200 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
              </svg>
              Nova Movimentação
            </button>
            <button class="w-full bg-white text-gray-700 font-semibold py-2 px-4 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors duration-200 flex items-center justify-center">
               <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Comparar Métodos
            </button>
          </div>
        </div>
      </section>

      <section class="bg-white p-6 rounded-xl shadow-sm border border-gray-200/80 mb-8">
        <span class="inline-block bg-violet-100 text-violet-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Custo_Medio</span>
        <h2 class="text-xl font-bold text-gray-800 mt-3">Resumo - {{ selectedProduct }}</h2>
        <p class="text-gray-500 mb-6">Cálculo de estoque pelo método CUSTO_MEDIO</p>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <p class="text-3xl font-bold text-violet-600">{{ summary.finalStock }}</p>
            <p class="text-sm text-gray-500">Estoque Final</p>
          </div>
          <div>
            <p class="text-3xl font-bold text-violet-600">{{ new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.stockValue) }}</p>
            <p class="text-sm text-gray-500">Valor do Estoque</p>
          </div>
          <div>
            <p class="text-3xl font-bold text-violet-600">{{ new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.averageCost) }}</p>
            <p class="text-sm text-gray-500">Custo Médio</p>
          </div>
          <div>
            <p class="text-3xl font-bold text-violet-600">{{ summary.totalEntries }}</p>
            <p class="text-sm text-gray-500">Total Entradas</p>
          </div>
        </div>
      </section>

      <section class="bg-white p-6 rounded-xl shadow-sm border border-gray-200/80">
        <h2 class="text-xl font-bold text-gray-800">Movimentações Detalhadas - Método CUSTO_MEDIO</h2>
        <p class="text-gray-500 mb-6">Histórico completo de movimentações com cálculos do método selecionado</p>
        <div class="overflow-x-auto">
          <table class="w-full text-sm text-left text-gray-600">
            <thead class="text-xs text-gray-700 uppercase bg-gray-50/80">
              <tr>
                <th scope="col" class="px-6 py-3 rounded-l-lg">Data</th>
                <th scope="col" class="px-6 py-3">Tipo</th>
                <th scope="col" class="px-6 py-3">Descrição</th>
                <th scope="col" class="px-6 py-3 text-right">Qtd</th>
                <th scope="col" class="px-6 py-3 text-right">Custo Unit.</th>
                <th scope="col" class="px-6 py-3 text-right">Total</th>
                <th scope="col" class="px-6 py-3 text-right">Estoque</th>
                <th scope="col" class="px-6 py-3 text-right">Valor Estoque</th>
                <th scope="col" class="px-6 py-3 text-right rounded-r-lg">Custo Médio</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in movements" :key="index" class="bg-white border-b last:border-0 hover:bg-gray-50/80">
                <td class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{{ item.date }}</td>
                <td class="px-6 py-4">
                  <span v-if="item.type === 'Entrada'" class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    Entrada
                  </span>
                  <span v-else class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                     <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    Saída
                  </span>
                </td>
                <td class="px-6 py-4">{{ item.description }}</td>
                <td class="px-6 py-4 text-right font-medium">{{ item.qty }}</td>
                <td class="px-6 py-4 text-right">{{ item.unitCost }}</td>
                <td class="px-6 py-4 text-right">{{ item.total }}</td>
                <td class="px-6 py-4 text-right font-medium">{{ item.stock }}</td>
                <td class="px-6 py-4 text-right font-semibold text-gray-900">{{ item.stockValue }}</td>
                <td class="px-6 py-4 text-right font-semibold text-gray-900">{{ item.averageCost }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
</template>
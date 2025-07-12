<template>
  <div class="p-6 bg-gray-50 min-h-screen">
    <h1 class="text-3xl font-bold text-gray-800 mb-8 text-center">Central de Ajuda Finvy</h1>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- Card: Documentação do Projeto -->
      <router-link to="/docs/project" class="block">
        <div
          class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300 h-full flex flex-col justify-between"
        >
          <div>
            <h2 class="text-xl font-semibold text-gray-700 mb-3">Documentação do Projeto</h2>
            <p class="text-gray-600 mb-4">
              Explore a documentação técnica e conceitual do Finvy, incluindo ambiente de
              desenvolvimento, conceitos fundamentais e guias de uso.
            </p>
          </div>
          <button
            class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 self-start"
          >
            Ver Documentação
          </button>
        </div>
      </router-link>

      <!-- Card: Documentação da API -->
      <router-link to="/docs/api" class="block">
        <div
          class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300 h-full flex flex-col justify-between"
        >
          <div>
            <h2 class="text-xl font-semibold text-gray-700 mb-3">Documentação da API</h2>
            <p class="text-gray-600 mb-4">
              Acesse a referência completa da API RESTful do Finvy, com detalhes sobre endpoints,
              requisições e respostas para integração.
            </p>
          </div>
          <button
            class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 self-start"
          >
            Ver API Docs
          </button>
        </div>
      </router-link>

      <!-- Card: Perguntas Frequentes (FAQ) -->
      <router-link to="/faq" class="block">
        <div
          class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300 h-full flex flex-col justify-between"
        >
          <div>
            <h2 class="text-xl font-semibold text-gray-700 mb-3">Perguntas Frequentes (FAQ)</h2>
            <p class="text-gray-600 mb-4">
              Encontre respostas rápidas para as dúvidas mais comuns sobre o uso do Finvy e suas
              funcionalidades.
            </p>
            <ul class="list-disc list-inside text-gray-600 mb-4">
              <li>Como criar um período contábil?</li>
              <li>Posso exportar relatórios por mês?</li>
              <li>Onde encontrar tutoriais?</li>
            </ul>
          </div>
          <button
            class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 self-start"
          >
            Ver FAQ
          </button>
        </div>
      </router-link>

      <!-- Card: Suporte -->
      <router-link to="/support" class="block">
        <div
          class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300 h-full flex flex-col justify-between"
        >
          <div>
            <h2 class="text-xl font-semibold text-gray-700 mb-3">Suporte</h2>
            <p class="text-gray-600 mb-4">
              Precisa de ajuda? Entre em contato com nossa equipe de suporte para assistência
              personalizada.
            </p>
            <p class="text-gray-600 mb-2">
              Email:
              <a href="mailto:suporte@finvy.com" class="text-blue-600 hover:underline"
                >suporte@finvy.com</a
              >
            </p>
            <p class="text-gray-600">Horário: Seg-Sex, 9h-18h (BRT)</p>
          </div>
          <button
            class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 self-start"
          >
            Entrar em Contato
          </button>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
// No specific script logic needed for this view
</script>

<style scoped>
/* Adicione estilos específicos se necessário */
</style>
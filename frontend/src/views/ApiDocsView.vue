<template>
  <div class="p-6 bg-gray-50 min-h-screen">
    <h1 class="text-3xl font-bold text-gray-800 mb-6">Documentação da API RESTful do Finvy</h1>

    <section class="mb-8">
      <h2 class="text-2xl font-semibold text-gray-700 mb-4">Estrutura de Rotas e Dados</h2>
      <p class="text-gray-600 leading-relaxed mb-4">
        Nesta página, você encontrará informações sobre como usar os recursos e os endpoints da API,
        bem como exemplos de requisições e respostas. A API é projetada para facilitar a integração
        com diferentes plataformas e linguagens de programação, seguindo os princípios RESTful de
        comunicação entre cliente e servidor.
      </p>
      <p class="text-gray-600 leading-relaxed mb-4">
        A documentação interativa abaixo é gerada automaticamente e fornece detalhes sobre cada
        endpoint, incluindo métodos HTTP, parâmetros, e modelos de dados.
      </p>
    </section>

    <section class="mb-8 h-[80vh]">
      <h2 class="text-2xl font-semibold text-gray-700 mb-4">Explorar Endpoints da API</h2>
      <div class="iframe-container bg-white rounded-lg shadow-md overflow-hidden h-full">
        <iframe src="/api/docs" class="w-full h-full border-none"></iframe>
      </div>
    </section>

    <section class="mb-8">
      <h2 class="text-2xl font-semibold text-gray-700 mb-4">URL do Ambiente de Produção</h2>
      <div class="bg-white p-6 rounded-lg shadow-md">
        <p class="text-gray-600 mb-2">A URL base para o ambiente de produção da API é:</p>
        <code class="block bg-gray-100 p-3 rounded-md text-gray-800 overflow-auto"
          >https://api.finvy.com</code
        >
        <p class="text-sm text-gray-500 mt-2">
          <i
            >(Nota: Esta URL é um exemplo e deve ser substituída pela URL real da sua API em
            produção.)</i
          >
        </p>
      </div>
    </section>

    <section>
      <h2 class="text-2xl font-semibold text-gray-700 mb-4">Dicas para Teste</h2>
      <div class="bg-white p-6 rounded-lg shadow-md">
        <p class="text-gray-600 mb-2">
          É possível testar o ambiente a partir de uma ferramenta de testes de API REST como
          <a href="https://hoppscotch.io/" target="_blank" class="text-blue-600 hover:underline"
            >Hoppscotch</a
          >
          ou
          <a href="https://www.postman.com/" target="_blank" class="text-blue-600 hover:underline"
            >Postman</a
          >.
        </p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
// No specific script logic needed for this view
</script>

<style scoped>
.iframe-container {
  height: 100%; /* Make iframe container take full height of its parent section */
}

iframe {
  min-height: 500px; /* Ensure iframe has a minimum height */
}
</style>
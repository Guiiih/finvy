<template>
  <div class="p-4 sm:p-6 bg-gray-50 min-h-screen">
    <h1 class="text-3xl font-bold text-gray-800 mb-8 text-center">Contato e Suporte</h1>

    <div class="max-w-xl mx-auto bg-white rounded-lg shadow-md p-8 text-center">
      <p class="text-gray-700 text-lg mb-6">
        Se você tiver dúvidas, precisar de assistência técnica ou desejar enviar feedback, nossa
        equipe de suporte está pronta para ajudar.
      </p>

      <div class="mb-6">
        <h2 class="text-2xl font-semibold text-gray-800 mb-3">Canais de Contato</h2>
        <p class="text-gray-600 text-lg mb-2">
          <i class="pi pi-envelope mr-2"></i> Email:
          <a href="mailto:suporte@finvy.com" class="text-blue-600 hover:underline font-medium"
            >suporte@finvy.com</a
          >
        </p>
        <p class="text-gray-600 text-lg">
          <i class="pi pi-phone mr-2"></i> Telefone:
          <span class="font-medium">+55 (XX) XXXX-XXXX</span> (Em breve)
        </p>
      </div>

      <div class="mb-6">
        <h2 class="text-2xl font-semibold text-gray-800 mb-3">Horário de Atendimento</h2>
        <p class="text-gray-600 text-lg">Nossa equipe está disponível para atendê-lo:</p>
        <p class="text-gray-600 text-lg font-medium">Segunda a Sexta-feira</p>
        <p class="text-gray-600 text-lg font-medium">Das 9h00 às 18h00 (Horário de Brasília)</p>
      </div>

      <div>
        <h2 class="text-2xl font-semibold text-gray-800 mb-3">Recursos Adicionais</h2>
        <p class="text-gray-600 mb-4">
          Para informações mais detalhadas, consulte nossa documentação completa e a seção de
          perguntas frequentes.
        </p>
        <router-link
          to="/help"
          class="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors duration-300"
        >
          Voltar para a Central de Ajuda
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Lógica específica para a view de Suporte, se houver.
</script>


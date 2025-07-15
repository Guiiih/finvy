<template>
  <div ref="swaggerContainer" class="p-4 sm:p-6 min-h-screen"></div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const swaggerContainer = ref<HTMLElement | null>(null);

onMounted(async () => {
  if (swaggerContainer.value) {
    // Importa SwaggerUI apenas em ambiente de desenvolvimento
    if (import.meta.env.DEV) {
      const SwaggerUI = (await import('swagger-ui-dist/swagger-ui-bundle.js')).default;
      await import('swagger-ui-dist/swagger-ui.css');

      SwaggerUI({
        url: '/api/docs', // Endpoint para a especificação OpenAPI do backend
        domNode: swaggerContainer.value,
        deepLinking: true,
        presets: [
          SwaggerUI.presets.apis,
          SwaggerUI.SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUI.plugins.DownloadUrl
        ],
        layout: "BaseLayout"
      });
    } else {
      // Em produção, você pode exibir uma mensagem ou redirecionar
      console.log('Swagger UI não disponível em produção.');
      if (swaggerContainer.value) {
        swaggerContainer.value.innerHTML = '<p>Documentação interativa não disponível em produção.</p>';
      }
    }
  }
});
</script>


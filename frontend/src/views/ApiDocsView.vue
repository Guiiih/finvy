<template>
  <div ref="swaggerContainer" class="swagger-container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import SwaggerUI from 'swagger-ui-dist/swagger-ui-bundle.js';
import 'swagger-ui-dist/swagger-ui.css';

const swaggerContainer = ref<HTMLElement | null>(null);

onMounted(() => {
  if (swaggerContainer.value) {
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
  }
});
</script>

<style scoped>
.swagger-container {
  padding: 20px;
  min-height: 800px; /* Garante que o container tenha altura suficiente */
}
</style>
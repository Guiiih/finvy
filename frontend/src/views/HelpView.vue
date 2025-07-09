<template>
  <div class="p-6 h-screen-minus-header">
    <h1 class="text-3xl font-bold text-gray-800 mb-6">Documentação da API</h1>
    <iframe src="/api/docs" class="w-full h-full border-none rounded-lg shadow-md"></iframe>
  </div>
</template>

<script setup lang="ts">
// No specific script logic needed
</script>

<style scoped>
.h-screen-minus-header {
  height: calc(100vh - 8rem); /* Adjust this value based on your header's height */
}

iframe {
  min-height: 600px; /* Provide a minimum height for smaller screens */
}
</style>
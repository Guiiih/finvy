import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'


export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'primeicons': fileURLToPath(new URL('../node_modules/primeicons', import.meta.url))
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Removed manualChunks for debugging
      },
    },
  },
  optimizeDeps: {
    include: ['primevue', 'primeicons'],
  },
})

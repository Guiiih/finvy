import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'


export default defineConfig({
  plugins: [
    vue(),
    tailwindcss() as any,
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
        
      },
    },
  },
  optimizeDeps: {
    include: ['primevue', 'primeicons'],
  },
})
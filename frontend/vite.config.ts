import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    visualizer({
      open: false, // Abre o relatório automaticamente no navegador
      // filename: "bundle-analysis.html", // Nome do arquivo de saída
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            const packageName = id.split('node_modules/')[1].split('/')[0];
            // Agrupa bibliotecas comuns em um chunk 'vendor'
            if (['vue', 'vue-router', 'pinia', 'axios', '@supabase', 'primevue', 'zod', 'vee-validate'].some(pkg => packageName.startsWith(pkg))) {
              return 'vendor';
            }
            // Outras bibliotecas de node_modules podem ir para seus próprios chunks ou para um chunk genérico
            return 'vendor_other';
          }
        },
      },
    },
  },
  optimizeDeps: {
    include: ['primevue', 'primeicons'],
  },
})

import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'primeicons': fileURLToPath(new URL('../node_modules/primeicons', import.meta.url))
    },
  },
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        
      manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('primevue') || id.includes('primeicons')) {
              return 'primevue';
            }
            if (id.includes('zod')) {
              return 'zod';
            }
            
            if (id.includes('pinia')) {
              return 'pinia';
            }
            if (id.includes('vue')) {
              return 'vue';
            }
            if (id.includes('vue-router')) {
              return 'vue-router';
            }
            if (id.includes('vee-validate')) {
              return 'vee-validate';
            }
            if (id.includes('@supabase/supabase-js')) {
              return 'supabase';
            }
            return 'vendor'; // Agrupa outras dependências em um chunk 'vendor'
          }
        },
      },
    },
  },
  optimizeDeps: {
    include: ['primevue', 'primeicons'],
  },
})

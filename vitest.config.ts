import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [vue()], // Adiciona o plugin do Vue
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './frontend/src'),
    },
  },
  test: {
    globals: true, // Usa APIs globais como describe, it, expect
    environment: 'jsdom', // Usa JSDOM para testes de frontend
    include: ['**/*.test.ts'], // Padrão para encontrar ficheiros de teste
    reporters: ['default', 'html'], // Gera um relatório HTML
  },
});

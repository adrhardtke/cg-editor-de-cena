import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// Configuração principal do Vite (importada do vitest/config para incluir tipos de teste)
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    // Alias para importações mais limpas
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    // Ambiente de testes simula o navegador
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
  },
})

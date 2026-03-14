import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,
    // Optionnel : permet au frontend de parler plus facilement au backend si besoin
    proxy: {
      '/api': 'http://localhost:3001'
    }
  }
})
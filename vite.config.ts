import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Временная ссылка Cloudflare (cloudflared tunnel) для просмотра с телефона
    allowedHosts: ['.trycloudflare.com'],
  },
})

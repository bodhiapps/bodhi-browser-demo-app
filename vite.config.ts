import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { copyFileSync } from 'fs'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/bodhi-browser-demo-app/' : '/',
  plugins: [
    react(),
    {
      name: 'copy-index-as-404',
      writeBundle() {
        // Copy index.html as 404.html for SPA routing support
        try {
          copyFileSync(
            path.resolve(__dirname, 'dist/index.html'),
            path.resolve(__dirname, 'dist/404.html')
          );
        } catch (error) {
          console.warn('Could not copy index.html as 404.html:', error);
        }
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})

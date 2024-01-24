import path from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), vueJsx(), ],
  resolve: {
    alias: {
      '@': path.resolve('src'),
    }
  },
  server: {
    https: {
      key: './myapp-privateKey.key',
      cert: './myapp.crt',
    }
    // proxy: {
    //   '/api': {
    //     target: 'http://localhost:8080',
    //     changeOrigin: true,
    //   },
    // },
  },
})

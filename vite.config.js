import path from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

export default defineConfig({
  plugins: [vue(), vueJsx(),],
  build: {
    target: 'esnext',
  },
  resolve: {
    alias: {
      '@': path.resolve('src'),
    }
  },
  vue: {
    script: {
      defineModel: true,
      propsDestructure: true
    }
  },
  define: {
    'process.env': process.env,
    __VUE_I18N_FULL_INSTALL__: true,
    __VUE_I18N_LEGACY_API__: false,
    __INTLIFY_PROD_DEVTOOLS__: false,
  },
  // server: {
  //   https: {
  //     key: process.env.VITE_HTTPS_KEY_PATH || '../myapp-privateKey.key',
  //     cert: process.env.VITE_HTTPS_CERT_PATH || '../myapp.crt',
  //   }
  // },
})

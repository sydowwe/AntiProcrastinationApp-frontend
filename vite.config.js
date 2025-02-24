import path from 'node:path'
import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

export default defineConfig({
    plugins: [vue({
        script: {
            defineModel: true,
            propsDestructure: true,
            generic: true
        },
        template: {

        }
    })],
    build: {
        target: 'esnext',
    },
    resolve: {
        alias: {
            '@': path.resolve('src'),
        }
    },
    define: {
        __VUE_I18N_FULL_INSTALL__: true,
        __VUE_I18N_LEGACY_API__: false,
        __INTLIFY_PROD_DEVTOOLS__: false,
    },
    server: {
        https: {
            key: './localhost-key.pem',
            cert: './localhost.pem',
        }
    },
})

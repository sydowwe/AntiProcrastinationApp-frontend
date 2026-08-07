import { fileURLToPath, URL } from 'node:url'
import { readFileSync } from 'node:fs'

import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import vueDevTools from 'vite-plugin-vue-devtools'
import { VitePWA } from 'vite-plugin-pwa'

/**
 * Makes `/sw.js` work in `vite dev`.
 *
 * The framework's push composable registers a hardcoded `/sw.js`
 * (`_common/utils/serviceWorker.ts`), which is right for a production build — `vite build` emits
 * `dist/sw.js`. In dev, though, vite-plugin-pwa serves the generated worker at `/dev-sw.js?dev-sw`,
 * so `/sw.js` hit the index.html catch-all and registration died on the resulting `text/html`.
 *
 * `src/_common` is a submodule this app must never edit, so the two names are reconciled here
 * instead: rewrite the request before vite-plugin-pwa's own middleware sees it. This is a rewrite,
 * not a redirect, on purpose — the service worker spec rejects a script URL that redirects.
 */
function devServiceWorkerAlias(): Plugin {
	return {
		name: 'dev-service-worker-alias',
		apply: 'serve',
		configureServer(server) {
			server.middlewares.use((req, _res, next) => {
				if (req.url === '/sw.js' || req.url?.startsWith('/sw.js?')) {
					req.url = '/dev-sw.js?dev-sw'
				}
				next()
			})
		},
	}
}

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		devServiceWorkerAlias(),
		vue({
			script: {},
		}),
		vuetify({ autoImport: true }),
		vueDevTools(),
		VitePWA({
			registerType: 'autoUpdate',
			includeAssets: ['favicon.svg', 'icons/*.png'],
			// Serve a service worker in `vite dev` too. Without this nothing answers /sw.js, the request
			// falls through to the index.html catch-all, and the framework's push composable —
			// `_common/modules/notifications/composable/UsePushNotifications.ts`, which registers the SW
			// on boot — logs "unsupported MIME type ('text/html')" on every page load. It also means Web
			// Push cannot be exercised locally at all.
			devOptions: {
				enabled: true,
				// Vite serves ESM in dev, so the dev SW has to be registered as a module.
				type: 'module',
			},
			manifest: {
				name: 'AntiProcrastination',
				short_name: 'AntiProc',
				description: 'Fight procrastination and boost your productivity',
				theme_color: '#1D4ED8',
				background_color: '#121212',
				display: 'standalone',
				scope: '/',
				start_url: '/',
				icons: [
					{
						src: '/icons/icon-48x48.png',
						sizes: '48x48',
						type: 'image/png',
					},
					{
						src: '/icons/icon-64x64.png',
						sizes: '64x64',
						type: 'image/png',
					},
					{
						src: '/icons/icon-128x128.png',
						sizes: '128x128',
						type: 'image/png',
					},
					{
						src: '/icons/icon-192x192.png',
						sizes: '192x192',
						type: 'image/png',
					},
					{
						src: '/icons/icon-256x256.png',
						sizes: '256x256',
						type: 'image/png',
					},
					{
						src: '/icons/icon-512x512.png',
						sizes: '512x512',
						type: 'image/png',
					},
					{
						src: '/icons/icon-512x512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'maskable',
					},
				],
			},
			workbox: {
				importScripts: ['/sw-push.js'],
				maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
				globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
				navigateFallback: '/index.html',
				navigateFallbackAllowlist: [/^\/(?!api)/],
				runtimeCaching: [
					{
						urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
						handler: 'CacheFirst',
						options: {
							cacheName: 'google-fonts-cache',
							expiration: {
								maxEntries: 10,
								maxAgeSeconds: 60 * 60 * 24 * 365,
							},
							cacheableResponse: {
								statuses: [0, 200],
							},
						},
					},
					{
						urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
						handler: 'CacheFirst',
						options: {
							cacheName: 'gstatic-fonts-cache',
							expiration: {
								maxEntries: 10,
								maxAgeSeconds: 60 * 60 * 24 * 365,
							},
							cacheableResponse: {
								statuses: [0, 200],
							},
						},
					},
				],
			},
		}),
	],
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
		},
	},
	define: {
		__VUE_I18N_FULL_INSTALL__: true,
		__VUE_I18N_LEGACY_API__: false,
		__INTLIFY_PROD_DEVTOOLS__: false,
		'import.meta.env.VITE_APP_VERSION': JSON.stringify(
			JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8')).version,
		),
	},
	server: {
		https: {
			key: './config/localhost-key.pem',
			cert: './config/localhost.pem',
		},
	},
})

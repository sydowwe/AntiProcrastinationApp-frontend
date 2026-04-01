/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
	readonly VITE_API_URL: string
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}

export {}

declare module 'vue' {
	interface ComponentCustomProperties {
		$t: typeof VueI18n.prototype.t
	}
}

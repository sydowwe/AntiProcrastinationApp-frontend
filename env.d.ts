/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
	readonly VITE_API_URL: string
	// Add other VITE_ prefixed environment variables here
	// readonly VITE_OTHER_VAR: string
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}

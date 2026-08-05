/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

import type VueI18n from 'vue-i18n'

// This file has top-level imports, so it is a module — env augmentation must go through
// `declare global` to reach vite's own `ImportMetaEnv`. `ImportMeta` itself already comes
// from vite/client and does not need redeclaring.
declare global {
	interface ImportMetaEnv {
		readonly VITE_API_URL: string
		readonly VITE_APP_URL: string
		readonly VITE_APP_VERSION: string
		readonly VITE_RECAPTCHA_SITE_KEY: string
		readonly VITE_GOOGLE_LOGIN_CLIENT_ID: string
		readonly VITE_ENABLE_ENCRYPTION: string
		readonly VITE_VAPID_PUBLIC_KEY: string
	}
}

// Augments axios' own request config. `src/_common/api/useRequestState.ts` passes `_silent`
// through to the interceptor, so without this the framework does not type-check. Declared here
// rather than in the submodule, which this project must never edit.
declare module 'axios' {
	interface AxiosRequestConfig {
		// When true, the response interceptor will NOT show an error snackbar for this request.
		// Use it when the caller wants to own error messaging (e.g. a contextual 409/422 message),
		// and then optionally fall back to `handleHttpCodes(status)` for statuses it doesn't special-case.
		_silent?: boolean
	}
}

declare module 'vue' {
	interface ComponentCustomProperties {
		$t: typeof VueI18n.prototype.t
	}
}

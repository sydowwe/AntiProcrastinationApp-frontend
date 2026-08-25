/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

import type VueI18n from 'vue-i18n'

// This file has top-level imports, so it is a module — env augmentation must go through
// `declare global` to reach vite's own `ImportMetaEnv`. `ImportMeta` itself already comes
// from vite/client and does not need redeclaring.
declare global {
	/**
	 * Set by `public/notification-subject-routes.js` — the single kind → destination map, loaded by
	 * the app through the `<script>` tag in `index.html` and by the service worker through workbox
	 * `importScripts`. See that file for why it is a classic script rather than a module.
	 *
	 * Declared **optional** deliberately: a `declare function` would type the call as always
	 * available, and a missing or blocked script would then be a `ReferenceError` at the click site.
	 * Call it as `globalThis.resolveNotificationSubjectPath?.(subject)` so the app degrades to
	 * type-level routing instead.
	 */

	var resolveNotificationSubjectPath:
		| ((subject: { kind: string; id: number } | undefined) => string | undefined)
		| undefined

	/** The Web Push click target — the full `subject → url → '/'` chain. Used by `sw-push.js`. */

	var resolveNotificationTargetUrl: ((data: unknown) => string) | undefined

	/** The raw map, exposed for the test that checks each path against the live route table. */

	var NOTIFICATION_SUBJECT_ROUTES: Record<string, (id: number) => string> | undefined

	interface ImportMetaEnv {
		readonly VITE_API_URL: string
		readonly VITE_APP_URL: string
		readonly VITE_APP_VERSION: string
		readonly VITE_SUPPORT_EMAIL: string
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

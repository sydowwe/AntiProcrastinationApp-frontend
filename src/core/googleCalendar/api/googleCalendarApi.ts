import { API } from '@/_common/axiosConfig.ts'

/**
 * `configured: false` means this deployment has no Google OAuth client at all — hide *Connect* and
 * word the integration as "not available here"; `connected` is always `false` then. When it is
 * `true`, `connected` says whether this account holds a refresh token (B14).
 */
export interface GoogleCalendarStatus {
	configured: boolean
	connected: boolean
}

/**
 * `syncedCount` is the events inserted or updated — what is on Google after the sync. `removedCount`
 * is the events deleted because their task was skipped or made background since the last sync.
 */
export interface GoogleCalendarSyncResult {
	syncedCount: number
	removedCount: number
}

export function useGoogleCalendarApi() {
	async function getStatus(): Promise<GoogleCalendarStatus> {
		const response = await API.get('/user/google-calendar/status')
		const { configured = false, connected = false } = response.data ?? {}
		return { configured: configured as boolean, connected: connected as boolean }
	}

	async function getAuthUrl(): Promise<string> {
		const response = await API.get('/user/google-calendar/auth-url')
		return response.data.url as string
	}

	// `state` is the CSRF token the auth-url endpoint put on Google's redirect and in a cookie; the
	// server rejects the exchange without it (F33). Silent: the callback view words the 400 by its
	// `errorType` (expired flow vs. Google refusing the code) instead of the interceptor's generic
	// sentence — and the server's own `message` is not authored for the user.
	async function connect(code: string, state: string): Promise<void> {
		await API.post('/user/google-calendar/connect', { code, state }, { _silent: true })
	}

	async function disconnect(): Promise<void> {
		await API.delete('/user/google-calendar/disconnect')
	}

	async function syncDay(calendarId: number): Promise<GoogleCalendarSyncResult> {
		const response = await API.post(`/calendar/${calendarId}/sync-to-google`)
		const { syncedCount = 0, removedCount = 0 } = response.data ?? {}
		return { syncedCount: syncedCount as number, removedCount: removedCount as number }
	}

	return { getStatus, getAuthUrl, connect, disconnect, syncDay }
}

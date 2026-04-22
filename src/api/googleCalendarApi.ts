import { API } from '@/plugins/axiosConfig.ts'

export function useGoogleCalendarApi() {
	async function getStatus(): Promise<boolean> {
		const response = await API.get('/user/google-calendar/status')
		return response.data.connected as boolean
	}

	async function getAuthUrl(): Promise<string> {
		const response = await API.get('/user/google-calendar/auth-url')
		return response.data.url as string
	}

	async function connect(code: string): Promise<void> {
		await API.post('/user/google-calendar/connect', { code })
	}

	async function disconnect(): Promise<void> {
		await API.delete('/user/google-calendar/disconnect')
	}

	async function syncDay(calendarId: number): Promise<number> {
		const response = await API.post(`/calendar/${calendarId}/sync-to-google`)
		return response.data.syncedCount as number
	}

	return { getStatus, getAuthUrl, connect, disconnect, syncDay }
}

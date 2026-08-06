import { API } from '@/_common/axiosConfig.ts'
import { UserSession } from '@/core/user/dto/response/UserSession.ts'

export function useSessionsApi() {
	async function fetchSessions(): Promise<UserSession[]> {
		const r = await API.get('/user/sessions')
		return UserSession.listFromObjects(r.data)
	}

	async function revokeSession(id: string): Promise<void> {
		await API.delete(`/user/sessions/${id}`)
	}

	async function revokeAllOtherSessions(): Promise<void> {
		await API.delete('/user/sessions/all')
	}

	return { fetchSessions, revokeSession, revokeAllOtherSessions }
}

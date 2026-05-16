import { API } from '@/plugins/axiosConfig.ts'
import { User } from '@/dtos/response/user/User.ts'
import type { UserPreferencesRequest } from '@/dtos/request/user/UserPreferencesRequest.ts'

export function useUserApi() {
	async function fetchUserData(): Promise<User> {
		const r = await API.post('/user/data', {})
		return User.fromJson(r.data)
	}

	async function updatePreferences(req: UserPreferencesRequest): Promise<void> {
		await API.put('/user/preferences', req)
	}

	async function resendVerification(): Promise<void> {
		await API.post('/user/resend-verification', {})
	}

	async function exportData(): Promise<Blob> {
		const r = await API.get('/user/data-export', { responseType: 'blob' })
		return r.data as Blob
	}

	return { fetchUserData, updatePreferences, resendVerification, exportData }
}

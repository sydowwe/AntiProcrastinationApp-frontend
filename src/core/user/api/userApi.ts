import { API } from '@/_common/axiosConfig.ts'
import { User } from '@/core/user/dto/response/User.ts'
import type { UserPreferencesRequest } from '@/core/user/dto/request/UserPreferencesRequest.ts'

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

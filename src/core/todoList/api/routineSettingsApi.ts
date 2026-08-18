import { API } from '@/_common/axiosConfig.ts'
import { UserRoutineSettings } from '@/core/todoList/dto/response/UserRoutineSettings.ts'
import type { UserRoutineSettingsRequest } from '@/core/todoList/dto/request/UserRoutineSettingsRequest.ts'

const url = 'routine/settings'

export function useRoutineSettingsApi() {
	/** A user who has never dismissed anything gets a null field, not a 404, and the read creates no row. */
	async function fetchSettings(): Promise<UserRoutineSettings> {
		const response = await API.get(url)
		return UserRoutineSettings.fromJson(response.data)
	}

	async function updateSettings(request: UserRoutineSettingsRequest): Promise<void> {
		await API.put(url, request)
	}

	return { fetchSettings, updateSettings }
}

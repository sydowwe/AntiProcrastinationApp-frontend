import { API } from '@/plugins/axiosConfig.ts'
import { UserPlannerSettings } from '@/dtos/response/UserPlannerSettings.ts'
import type { UserPlannerSettingsRequest } from '@/dtos/request/UserPlannerSettingsRequest.ts'

const url = 'planner/settings'

export function usePlannerSettingsApi() {
	async function fetchSettings(): Promise<UserPlannerSettings> {
		const response = await API.get(url)
		return UserPlannerSettings.fromJson(response.data)
	}

	async function updateSettings(req: UserPlannerSettingsRequest): Promise<void> {
		await API.put(url, req)
	}

	return { fetchSettings, updateSettings }
}

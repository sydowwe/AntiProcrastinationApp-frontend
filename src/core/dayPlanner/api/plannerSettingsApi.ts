import { API } from '@/_common/axiosConfig.ts'
import { UserPlannerSettings } from '@/core/dayPlanner/dto/response/UserPlannerSettings.ts'
import type { UserPlannerSettingsRequest } from '@/core/dayPlanner/dto/request/UserPlannerSettingsRequest.ts'

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

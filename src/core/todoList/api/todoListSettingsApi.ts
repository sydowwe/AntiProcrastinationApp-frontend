import { API } from '@/_common/axiosConfig.ts'
import { UserTodoListSettings } from '@/core/todoList/dto/response/UserTodoListSettings.ts'
import type { UserTodoListSettingsRequest } from '@/core/todoList/dto/request/UserTodoListSettingsRequest.ts'

const url = 'todo-list/settings'

export function useTodoListSettingsApi() {
	async function fetchSettings(): Promise<UserTodoListSettings> {
		const response = await API.get(url)
		return UserTodoListSettings.fromJson(response.data)
	}

	/** A changed lead re-registers every open timed to-do server-side, so it reaches existing items too. */
	async function updateSettings(request: UserTodoListSettingsRequest): Promise<void> {
		await API.put(url, request)
	}

	return { fetchSettings, updateSettings }
}

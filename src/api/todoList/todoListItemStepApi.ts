import { API } from '@/plugins/axiosConfig.ts'

export function useTodoListItemStepApi() {
	async function toggleStep(itemId: number, stepId: number): Promise<void> {
		await API.patch(`todo-list-item/${itemId}/steps/${stepId}/toggle`)
	}

	return { toggleStep }
}

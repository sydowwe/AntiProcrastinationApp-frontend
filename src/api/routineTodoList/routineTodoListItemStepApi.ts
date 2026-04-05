import { API } from '@/plugins/axiosConfig.ts'

export function useRoutineTodoListItemStepApi() {
	async function toggleStep(itemId: number, stepId: number): Promise<void> {
		await API.patch(`routine-todo-list/${itemId}/steps/${stepId}/toggle`)
	}

	return { toggleStep }
}

import type { IBasePlannerTask } from '@/dtos/response/activityPlanning/IBasePlannerTask.ts'
import type { IBasePlannerTaskRequest } from '@/dtos/request/activityPlanning/IBasePlannerTaskRequest.ts'
import type { IBaseDayPlannerStore } from '@/stores/dayPlanner/IBaseDayPlannerStore.ts'
import { useUndoStack } from '@/composables/general/useUndoStack.ts'
import { useSnackbar } from '@/composables/general/SnackbarComposable.ts'

export function usePlannerCrud<
	TTask extends IBasePlannerTask<TTaskRequest>,
	TTaskRequest extends IBasePlannerTaskRequest,
>(
	store: IBaseDayPlannerStore<TTask, TTaskRequest>,
	api: {
		createWithResponse: (request: TTaskRequest) => Promise<TTask>
		update: (id: number, request: TTaskRequest) => Promise<void>
		fetchById: (id: number) => Promise<TTask>
		deleteEntity: (id: number) => Promise<void>
		batchDelete: (ids: number[]) => Promise<void>
		applyContext: (request: TTaskRequest) => void
		buildRequestFromEntity: (task: TTask) => TTaskRequest
	},
) {
	const { push } = useUndoStack()
	const { showSuccessSnackbar, showErrorSnackbar } = useSnackbar()

	function undoDate() {
		return store.viewedDate ? new Date(store.viewedDate) : undefined
	}

	async function create(request: TTaskRequest) {
		if (!request.startTime || !request.endTime) return
		api.applyContext(request)
		const response = await api.createWithResponse(request)
		if (response.isBackground) {
			store.updateIsDuringBackgroundFlags(response)
		} else {
			response.isDuringBackgroundTask = store.checkOverlapsBackground(response)
		}
		store.setGridPositionFromSpan(response)
		store.tasks.push(response)
		push({
			description: 'Task created',
			date: undoDate(),
			undo: async () => {
				await api.deleteEntity(response.id)
				store.tasks = store.tasks.filter(t => t.id !== response.id)
			},
		})
		showSuccessSnackbar('Task created')
	}

	async function edit(id: number, request: TTaskRequest) {
		if (!request.startTime || !request.endTime) {
			showErrorSnackbar('Set start time and end time')
			return
		}
		const index = store.tasks.findIndex(e => e.id === id)
		const originalTask = { ...store.tasks[index]! } as TTask
		const wasBackground = store.tasks[index]?.isBackground
		api.applyContext(request)
		await api.update(id, request)
		const updatedItem = await api.fetchById(id)
		if (request.isBackground !== wasBackground) {
			store.updateIsDuringBackgroundFlags(updatedItem)
		}
		store.setGridPositionFromSpan(updatedItem)
		store.tasks[index] = updatedItem
		if (!request.isBackground) {
			updatedItem.isDuringBackgroundTask = store.checkOverlapsBackground(updatedItem)
		}
		push({
			description: 'Task updated',
			date: undoDate(),
			undo: async () => {
				const undoRequest = api.buildRequestFromEntity(originalTask)
				api.applyContext(undoRequest)
				await api.update(id, undoRequest)
				const restored = await api.fetchById(id)
				store.setGridPositionFromSpan(restored)
				const idx = store.tasks.findIndex(e => e.id === id)
				if (idx >= 0) store.tasks[idx] = restored
			},
		})
		showSuccessSnackbar('Task updated')
	}

	async function del() {
		if (store.isTemplateInPreview) {
			store.tasks = store.tasks.filter(e => !store.selectedTaskIds.has(e.id))
			store.deleteDialog = false
			return
		}
		const deletedTasks = [...store.tasks.filter(e => store.selectedTaskIds.has(e.id))] as TTask[]
		if (store.selectedTaskIds.size === 1) {
			const idToDelete = store.selectedTaskIds.values().next().value!
			await api.deleteEntity(idToDelete)
			store.tasks.splice(
				store.tasks.findIndex(e => e.id === idToDelete),
				1,
			)
			store.selectedTaskIds.clear()
		} else if (store.selectedTaskIds.size > 1) {
			const ids = Array.from(store.selectedTaskIds)
			await api.batchDelete(ids)
			store.tasks = store.tasks.filter(e => !store.selectedTaskIds.has(e.id))
			store.selectedTaskIds.clear()
		}
		store.deleteDialog = false
		push({
			description: 'Task deleted',
			date: undoDate(),
			undo: async () => {
				for (const task of deletedTasks) {
					const request = api.buildRequestFromEntity(task)
					api.applyContext(request)
					const recreated = await api.createWithResponse(request)
					if (recreated.isBackground) {
						store.updateIsDuringBackgroundFlags(recreated)
					} else {
						recreated.isDuringBackgroundTask = store.checkOverlapsBackground(recreated)
					}
					store.setGridPositionFromSpan(recreated)
					store.tasks.push(recreated)
				}
			},
		})
		showSuccessSnackbar('Task deleted')
	}

	return { create, edit, del }
}

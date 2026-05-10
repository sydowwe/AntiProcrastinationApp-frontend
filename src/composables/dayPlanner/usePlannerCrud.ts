import type { IBasePlannerTask } from '@/dtos/response/activityPlanning/IBasePlannerTask.ts'
import type { IBasePlannerTaskRequest } from '@/dtos/request/activityPlanning/IBasePlannerTaskRequest.ts'
import type { IBaseDayPlannerStore } from '@/stores/dayPlanner/IBaseDayPlannerStore.ts'
import { useUndoStack } from '@/composables/general/useUndoStack.ts'
import { useSnackbar } from '@/composables/general/SnackbarComposable.ts'
import { Time } from '@/dtos/dto/Time.ts'

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

	async function splitTask() {
		if (store.selectedTaskIds.size !== 1) return
		const id = Array.from(store.selectedTaskIds)[0]!
		const task = store.tasks.find(e => e.id === id)
		if (!task) return

		const startMin = task.startTime.getInMinutes
		const endMin = task.endTime.getInMinutes
		const effectiveEndMin = endMin <= startMin ? endMin + 1440 : endMin
		const totalDuration = effectiveEndMin - startMin

		if (totalDuration < 2) {
			showErrorSnackbar('Task is too short to split')
			return
		}

		const midMin = startMin + Math.floor(totalDuration / 2)
		const midTime = Time.fromMinutes(midMin % 1440)
		const originalEndTime = task.endTime

		const updatedRequest = api.buildRequestFromEntity(task)
		updatedRequest.endTime = midTime
		api.applyContext(updatedRequest)

		const secondRequest = api.buildRequestFromEntity(task)
		secondRequest.startTime = midTime
		secondRequest.endTime = originalEndTime
		api.applyContext(secondRequest)

		await api.update(id, updatedRequest)
		const updatedOriginal = await api.fetchById(id)
		const newTask = await api.createWithResponse(secondRequest)

		const index = store.tasks.findIndex(e => e.id === id)
		store.setGridPositionFromSpan(updatedOriginal)
		store.tasks[index] = updatedOriginal

		store.setGridPositionFromSpan(newTask)
		newTask.isDuringBackgroundTask = store.checkOverlapsBackground(newTask)
		store.tasks.push(newTask)

		store.selectedTaskIds.clear()

		push({
			description: 'Task split',
			date: undoDate(),
			undo: async () => {
				await api.deleteEntity(newTask.id)
				store.tasks = store.tasks.filter(t => t.id !== newTask.id)
				const restoreRequest = api.buildRequestFromEntity(updatedOriginal)
				restoreRequest.endTime = originalEndTime
				api.applyContext(restoreRequest)
				await api.update(id, restoreRequest)
				const restored = await api.fetchById(id)
				store.setGridPositionFromSpan(restored)
				const idx = store.tasks.findIndex(e => e.id === id)
				if (idx >= 0) store.tasks[idx] = restored
			},
		})

		showSuccessSnackbar('Task split')
	}

	return { create, edit, del, splitTask }
}

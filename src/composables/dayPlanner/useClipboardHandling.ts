import { watch } from 'vue'
import { type IBasePlannerTask, TaskSpan } from '@/dtos/response/activityPlanning/IBasePlannerTask.ts'
import type { IBasePlannerTaskRequest } from '@/dtos/request/activityPlanning/IBasePlannerTaskRequest.ts'
import type { IBaseDayPlannerStore } from '@/stores/dayPlanner/IBaseDayPlannerStore.ts'
import { useUndoStack } from '@/composables/general/useUndoStack.ts'
import { useSnackbar } from '@/composables/general/SnackbarComposable.ts'
import { Time } from '@/dtos/dto/Time.ts'

export function useClipboardHandling<
	TTask extends IBasePlannerTask<TTaskRequest>,
	TTaskRequest extends IBasePlannerTaskRequest,
>(
	store: IBaseDayPlannerStore<TTask, TTaskRequest>,
	api: {
		createWithResponse: (request: TTaskRequest) => Promise<TTask>
		batchDelete: (ids: number[]) => Promise<void>
		applyContext: (request: TTaskRequest) => void
		buildRequestFromEntity: (task: TTask) => TTaskRequest
		getCurrentContext: () => string
	},
) {
	const { push } = useUndoStack()
	const { showSuccessSnackbar } = useSnackbar()

	async function handleClipboardPlace(clipboard: { tasks: TTask[]; mode: 'cut' | 'duplicate' }, startSlot: number) {
		store.pendingClipboard = null
		store.clipboardPlacementSlot = null

		const sorted = [...clipboard.tasks].sort((a, b) => a.startTime.getInMinutes - b.startTime.getInMinutes)
		const placementTime = store.slotIndexToTime(startSlot - 1)
		const offsetMinutes = placementTime.getInMinutes - sorted[0]!.startTime.getInMinutes
		const undoDate = store.viewedDate ? new Date(store.viewedDate) : undefined

		if (clipboard.mode === 'cut') {
			const isCrossContext = !!clipboard.sourceContext && clipboard.sourceContext !== api.getCurrentContext()

			if (isCrossContext) {
				const ids = sorted.map(t => t.id)
				for (const task of sorted) {
					const newStart = Time.fromMinutes((task.startTime.getInMinutes + offsetMinutes + 1440) % 1440)
					const newEnd = Time.fromMinutes((task.endTime.getInMinutes + offsetMinutes + 1440) % 1440)
					const request = api.buildRequestFromEntity(task)
					api.applyContext(request)
					request.startTime = newStart
					request.endTime = newEnd
					const response = await api.createWithResponse(request)
					store.setGridPositionFromSpan(response)
					response.isDuringBackgroundTask = store.checkOverlapsBackground(response)
					store.tasks.push(response)
				}
				await api.batchDelete(ids)
				showSuccessSnackbar('Task moved')
			} else {
				const originalSpans = sorted.map(t => ({
					id: t.id,
					startTime: new Time(t.startTime.hours, t.startTime.minutes),
					endTime: new Time(t.endTime.hours, t.endTime.minutes),
				}))
				for (const task of sorted) {
					const newStart = Time.fromMinutes((task.startTime.getInMinutes + offsetMinutes + 1440) % 1440)
					const newEnd = Time.fromMinutes((task.endTime.getInMinutes + offsetMinutes + 1440) % 1440)
					task.startTime = newStart
					task.endTime = newEnd
					store.setGridPositionFromSpan(task)
					task.isDuringBackgroundTask = store.checkOverlapsBackground(task)
					store.tasks.push(task)
					await store.updateTaskSpan(task.id, TaskSpan.fromTask(task))
				}
				push({
					description: 'Task moved',
					date: undoDate,
					undo: async () => {
						for (const orig of originalSpans) {
							const task = store.tasks.find(t => t.id === orig.id) as TTask | undefined
							if (!task) continue
							task.startTime = orig.startTime
							task.endTime = orig.endTime
							store.setGridPositionFromSpan(task)
							await store.updateTaskSpan(orig.id, new TaskSpan(orig.startTime, orig.endTime))
						}
					},
				})
				showSuccessSnackbar('Task moved')
			}
		}

		if (clipboard.mode === 'duplicate') {
			const created: TTask[] = []
			for (const task of sorted) {
				const newStart = Time.fromMinutes((task.startTime.getInMinutes + offsetMinutes + 1440) % 1440)
				const newEnd = Time.fromMinutes((task.endTime.getInMinutes + offsetMinutes + 1440) % 1440)
				const request = api.buildRequestFromEntity(task)
				api.applyContext(request)
				request.startTime = newStart
				request.endTime = newEnd
				const response = await api.createWithResponse(request)
				store.setGridPositionFromSpan(response)
				response.isDuringBackgroundTask = store.checkOverlapsBackground(response)
				store.tasks.push(response)
				created.push(response)
			}
			push({
				description: 'Tasks duplicated',
				date: undoDate,
				undo: async () => {
					const ids = created.map(t => t.id)
					await api.batchDelete(ids)
					store.tasks = store.tasks.filter(t => !ids.includes(t.id))
				},
			})
			showSuccessSnackbar('Tasks duplicated')
		}
	}

	watch(
		() => store.clipboardPlacementSlot,
		async slotIndex => {
			if (slotIndex === null || !store.pendingClipboard) return
			await handleClipboardPlace(store.pendingClipboard, slotIndex)
		},
	)
}

import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Time } from '@/_common/dto/dto/Time.ts'
import { timeInUserZone } from '@/_common/composable/general/useUserClock.ts'
import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
import { useUndoStack } from '@/_common/composable/general/useUndoStack.ts'
import { useTaskPlannerCrud } from '@/core/dayPlanner/api/plannerTaskApi.ts'
import { useDayPlannerStore } from '@/core/dayPlanner/store/dayPlannerStore.ts'
import { PlannerTaskStatus } from '@/core/dayPlanner/dto/enum/PlannerTaskStatus.ts'
import { PatchPlannerTaskStatusRequest } from '@/core/dayPlanner/dto/request/PatchPlannerTaskStatusRequest.ts'
import { TaskSpan } from '@/core/dayPlanner/dto/response/IBasePlannerTask.ts'
import type { PlannerTask } from '@/core/dayPlanner/dto/response/PlannerTask.ts'

/** The latest end a span may have: the server's span validator wants start before end, so no wrap past midnight. */
const LAST_MINUTE_OF_DAY = 1439

/**
 * The two answers to "time's up — wrap up or extend?" (P1-04's `PlannedBlockOverrun`), as one-tap actions on a
 * started block. The same two writes backend P2-03's push action buttons will make: the status sub-resource and
 * the span patch.
 *
 * **Done needs no log-time dialog here.** Every other path to *Completed* opens one, because a block that was
 * never started has no record of when it was done. A started one does: its actual start is on the row, and its
 * actual end is now. The dialog would only ask the user to confirm two values the app already knows.
 */
export function useWrapUpBlock() {
	const store = useDayPlannerStore()
	const { patchStatus } = useTaskPlannerCrud()
	const undoStack = useUndoStack()
	const { showSuccessSnackbar, showErrorSnackbar } = useSnackbar()
	const { t } = useI18n()

	const completing = ref(false)
	const extending = ref(false)

	/**
	 * Completes the block with its own actual start and an actual end of now, on the user's clock. A block started
	 * before the status menu recorded a start (and the seed's in-progress rows) has none, so the planned one stands
	 * in. Only honest while the overrun is fresh — the caller decides when "now" has stopped being a fair answer
	 * (see `OverrunBanner`).
	 */
	async function completeNow(task: PlannerTask): Promise<boolean> {
		const actualStartTime = task.actualStartTime ?? task.startTime
		const actualEndTime = timeInUserZone()
		completing.value = true
		try {
			await patchStatus(
				task.id,
				new PatchPlannerTaskStatusRequest(PlannerTaskStatus.Completed, actualStartTime, actualEndTime),
				{ _silent: true },
			)
		} catch {
			showErrorSnackbar(t('planner.feedback.taskStatusUpdateFailed'))
			return false
		} finally {
			completing.value = false
		}
		task.status = PlannerTaskStatus.Completed
		task.isDone = true
		task.actualStartTime = actualStartTime
		task.actualEndTime = actualEndTime
		showSuccessSnackbar(t('planner.feedback.taskMarkedCompleted'))
		return true
	}

	/**
	 * How many of `minutes` the block can actually be extended by: up to 23:59, since a span may not wrap past
	 * midnight. 0 when there is no room, or when the block already wraps (a row from before that rule).
	 */
	function extendableMinutes(task: PlannerTask, minutes: number): number {
		const start = task.startTime.getInMinutes
		const end = task.endTime.getInMinutes
		if (end <= start) return 0
		return Math.max(0, Math.min(minutes, LAST_MINUTE_OF_DAY - end))
	}

	/** Moves the block's planned end later, as a resize would, with the same undo. */
	async function extend(task: PlannerTask, minutes: number): Promise<boolean> {
		const by = extendableMinutes(task, minutes)
		if (by === 0) return false

		const originalEnd = task.endTime
		const newEnd = Time.fromMinutes(originalEnd.getInMinutes + by)
		extending.value = true
		try {
			// No `_silent` to pass through `updateTaskSpan`, so a failure is the interceptor's snackbar.
			await store.updateTaskSpan(task.id, new TaskSpan(task.startTime, newEnd))
		} catch {
			return false
		} finally {
			extending.value = false
		}
		redrawEnd(task.id, newEnd)
		undoStack.push({
			description: t('planner.undo.taskExtended'),
			date: new Date(store.viewedDate),
			undo: async () => {
				const current = store.tasks.find(e => e.id === task.id)
				if (!current) return
				await store.updateTaskSpan(task.id, new TaskSpan(current.startTime, originalEnd))
				redrawEnd(task.id, originalEnd)
			},
		})
		showSuccessSnackbar(t('planner.feedback.taskExtended', { minutes: by }))
		return true
	}

	function redrawEnd(taskId: number, endTime: Time) {
		const task = store.tasks.find(e => e.id === taskId)
		if (!task) return
		task.endTime = endTime
		store.setGridPositionFromSpan(task)
		task.isDuringBackgroundTask = store.checkOverlapsBackground(task)
	}

	return { completeNow, extend, extendableMinutes, completing, extending }
}

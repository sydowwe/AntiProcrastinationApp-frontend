import { ref } from 'vue'
import type { PlannerTask } from '@/core/dayPlanner/dto/response/PlannerTask.ts'
import { useTaskPlannerCrud } from '@/core/dayPlanner/api/plannerTaskApi.ts'
import { Time } from '@/_common/dto/dto/Time.ts'
import { nowMinutes } from '@/core/home/composable/useTodayPlan.ts'

// Module-level, for the same reason `useTodayPlan`'s plan is: "track this task" is offered from the
// now bar and from every planner row, but the page has one timer dialog, mounted once in HomeView.
// Component-local state would mean one dialog instance per call site, and the call site that owned
// the dialog would quietly be the only one able to offer the action — which is the shape of the bug
// this whole change is undoing.
const isOpen = ref(false)
const trackedTask = ref<PlannerTask | null>(null)

// One request-state pair for the module rather than one per consumer; `useTodayPlan` does the same.
let plannerApi: ReturnType<typeof useTaskPlannerCrud> | null = null

/**
 * Free functions, not members of the composable below, so that a per-row caller can reach them
 * without calling anything that registers a `useDashboardRefresh` consumer — see the note above
 * `nowMinutes` in useTodayPlan.ts. Nothing here needs a component instance.
 */
export function openTracker(task: PlannerTask): void {
	trackedTask.value = task
	isOpen.value = true
}

/** Pre-fill the timer with what is left of the slot, or the whole slot once it has passed. */
export function remainingLength(task: PlannerTask): Time {
	const remaining = task.endTime.getInMinutes - nowMinutes.value
	return Time.fromMinutes(remaining > 0 ? remaining : task.endTime.getInMinutes - task.startTime.getInMinutes)
}

/** Starting the timer is also starting the task — keep the plan's status in step with it. */
export function handleTrackingStarted(actualStartTime: Time): void {
	if (trackedTask.value === null) return
	void (plannerApi ??= useTaskPlannerCrud()).markInProgress(trackedTask.value.id, actualStartTime)
}

/** Bundled form, for the one component that hosts the dialog. */
export function useTaskTracker() {
	return { isOpen, trackedTask, openTracker, remainingLength, handleTrackingStarted }
}

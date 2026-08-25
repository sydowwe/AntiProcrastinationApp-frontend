import { computed } from 'vue'
import { useCurrentTime } from '@/_common/composable/general/useCurrentTime.ts'
import { PlannerTaskStatus } from '@/core/dayPlanner/dto/enum/PlannerTaskStatus.ts'
import { getSpanMinutes } from '@/core/dayPlanner/utils/taskDuration.ts'
import type { PlannerTask } from '@/core/dayPlanner/dto/response/PlannerTask.ts'
import type { IDayPlannerStore } from '@/core/dayPlanner/store/dayPlannerStore.ts'
import type { Time } from '@/_common/dto/dto/Time.ts'

/**
 * Buehler, Griffin & Ross (1994): people underestimate their own task durations persistently, and
 * telling them to "add a buffer" does not fix it — showing their own past estimation error does.
 * This is that number, for the viewed day, built from the actualStartTime/actualEndTime that
 * DayPlannerLogTimeController already fills in on completion.
 *
 * Deliberately withheld until the day is over: a drift verdict at 10:00 for a day that ends at
 * 23:00 is not a correction, it is noise. `isDayMateriallyDone` gates the whole thing on that.
 */

type LoggedTask = PlannerTask & { actualStartTime: Time; actualEndTime: Time }

const MINUTES_IN_DAY = 1440

/** Signed difference `to - from`, folded into (-720, 720] so a same-day pair reads as itself
 *  rather than wrapping almost a full day just because `to` happens to be earlier. */
function signedDiffMinutes(from: Time, to: Time): number {
	const raw = to.getInMinutes - from.getInMinutes
	return ((((raw + MINUTES_IN_DAY / 2) % MINUTES_IN_DAY) + MINUTES_IN_DAY) % MINUTES_IN_DAY) - MINUTES_IN_DAY / 2
}

function hasLoggedTime(task: PlannerTask): task is LoggedTask {
	return task.status === PlannerTaskStatus.Completed && task.actualStartTime !== null && task.actualEndTime !== null
}

export function usePlanVsActual(store: IDayPlannerStore) {
	const { currentTime } = useCurrentTime()

	const isDayMateriallyDone = computed(() => currentTime.value >= store.viewEndDate)

	// Cancelled tasks were deliberately not done — that is not overrun time, so they are left out
	// entirely rather than averaged into the drift. Background tasks are context, not a plan.
	//
	// Completed but with no actualStartTime/actualEndTime (completed without logging the time) is
	// dropped here too, from *both* sides. Counting its planned minutes while it can contribute
	// nothing to the logged minutes would quietly report the day as under-run, and no line in the
	// drift summary would explain why — the task is Completed, so it is not "never happened" either.
	// There is nothing honest to compare it against, so it is compared against nothing.
	const eligibleTasks = computed(() =>
		store.tasks.filter(
			t =>
				t.id > 0 &&
				!t.isBackground &&
				t.status !== PlannerTaskStatus.Cancelled &&
				(t.status !== PlannerTaskStatus.Completed || hasLoggedTime(t)),
		),
	)

	const loggedTasks = computed(() => eligibleTasks.value.filter(hasLoggedTime))

	const neverHappenedCount = computed(
		() => eligibleTasks.value.filter(t => t.status !== PlannerTaskStatus.Completed).length,
	)

	const plannedMinutes = computed(() =>
		eligibleTasks.value.reduce((sum, t) => sum + getSpanMinutes(t.startTime, t.endTime), 0),
	)

	const actualMinutes = computed(() =>
		loggedTasks.value.reduce((sum, t) => sum + getSpanMinutes(t.actualStartTime, t.actualEndTime), 0),
	)

	const startedLateCount = computed(
		() => loggedTasks.value.filter(t => signedDiffMinutes(t.startTime, t.actualStartTime) > 0).length,
	)

	const ranLongerCount = computed(
		() =>
			loggedTasks.value.filter(
				t => getSpanMinutes(t.actualStartTime, t.actualEndTime) > getSpanMinutes(t.startTime, t.endTime),
			).length,
	)

	const isShown = computed(
		() => isDayMateriallyDone.value && (loggedTasks.value.length > 0 || neverHappenedCount.value > 0),
	)

	return {
		isShown,
		plannedMinutes,
		actualMinutes,
		startedLateCount,
		ranLongerCount,
		neverHappenedCount,
	}
}

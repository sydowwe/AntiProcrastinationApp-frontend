import { computed } from 'vue'
import { useCurrentTime } from '@/_common/composable/general/useCurrentTime.ts'
import { minutesOfDayInUserZone } from '@/_common/composable/general/useUserClock.ts'
import { useCurrentTimeIndicator } from '@/core/dayPlanner/composable/useCurrentTimeIndicator.ts'
import { PlannerTaskStatus } from '@/core/dayPlanner/dto/enum/PlannerTaskStatus.ts'
import type { PlannerTask } from '@/core/dayPlanner/dto/response/PlannerTask.ts'
import type { IDayPlannerStore } from '@/core/dayPlanner/store/dayPlannerStore.ts'

/**
 * "What am I supposed to be doing right now, and what is next" — derived from the plan already on
 * screen, so it costs no request and cannot disagree with the grid beside it.
 *
 * Deliberately **not** a second `useTodayPlan` (`src/core/home/`). That one owns the home page's
 * copy of today: its own fetch, its own module-level state, its own refresh policy. This one reads
 * `store.tasks`, which is the plan the user is editing — drags, resizes and unsaved status ticks
 * included — because a header that lags the grid under it by a refresh interval is worse than no
 * header at all. Cross-module composable imports are forbidden anyway (see CLAUDE.md); the two are
 * kept aligned by using the same rules, which are spelled out below.
 *
 * This is a passive display. `useTaskReminders` owns time-based alerting and is wired to the user's
 * reminder settings — nothing here notifies, and nothing here escalates.
 */

const MINUTES_IN_DAY = 1440

/**
 * One unfinished task, placed on the view's own timeline.
 *
 * `start` / `end` are minutes **from `viewStartTime`**, not minutes since midnight. The planner view
 * routinely wraps past midnight (the default is 07:30 → 01:30), and raw wall-clock minutes order a
 * 00:15 task before a 23:00 one inside such a view. This is the same modulo-1440 offset
 * `timeToSlotIndex` uses to place a task on the grid, so "next" here is always the next block
 * *downward on screen*.
 */
interface ViewSlot {
	task: PlannerTask
	start: number
	end: number
}

/** Done with, one way or the other. Same rule as `useTodayPlan.isFinished`, deliberately. */
function isFinished(task: PlannerTask): boolean {
	return task.status === PlannerTaskStatus.Completed || task.status === PlannerTaskStatus.Cancelled
}

export function usePlannerNowNext(store: IDayPlannerStore) {
	const { currentTime } = useCurrentTime()
	// The same check that decides whether the now-line is drawn: today, and inside the visible range.
	// Off it, there is no "now" to speak of — and `store.tasks` is fetched filtered to that range, so
	// there would be nothing outside it to point at either.
	const { isVisible } = useCurrentTimeIndicator(store)

	function offsetInView(minutes: number): number {
		return (minutes - store.viewStartTime.getInMinutes + MINUTES_IN_DAY) % MINUTES_IN_DAY
	}

	const nowOffset = computed(() => offsetInView(minutesOfDayInUserZone(currentTime.value)))

	const slots = computed<ViewSlot[]>(() => {
		if (!isVisible.value) return []
		return store.tasks
			.filter(
				task =>
					// Template-preview tasks are negative ids and are not planned yet — the surface keeps
					// describing the real day underneath the preview.
					task.id > 0 &&
					// Background tasks span the day by design, so one would sit in "now" permanently and
					// never let the actual block through. They are context, not an answer to "what am I
					// doing". Every other count in this module filters them the same way.
					!task.isBackground &&
					!isFinished(task),
			)
			.map(task => {
				const start = offsetInView(task.startTime.getInMinutes)
				let end = offsetInView(task.endTime.getInMinutes)
				// A task ending exactly at (or before) its own start offset ends at the far edge of the
				// view, not at the near one — e.g. 07:00–07:30 in a view that starts at 07:30.
				if (end <= start) end += MINUTES_IN_DAY
				return { task, start, end }
			})
			.sort((a, b) => a.start - b.start || a.end - b.end || a.task.id - b.task.id)
	})

	/**
	 * Overlaps are allowed in this grid, so "now" needs a rule rather than a `find`. In order:
	 *
	 * 1. **An explicit `InProgress` tick wins**, even past the task's end time. The user has said what
	 *    they are doing; no derived guess beats that, and a task left running past its slot is the
	 *    single most likely thing to actually be happening.
	 * 2. **Otherwise the earliest-starting task whose window contains now.**
	 *
	 * Importance is deliberately *not* consulted. It is null on most tasks, so it would decide some
	 * overlaps and not others; and `useTodayPlan` already answers this question for the home page with
	 * rules 1 and 2. Two surfaces naming a different "now" for the same day would be worse than either
	 * rule on its own. `end` and `id` are tie-breaks only, so the answer never flickers between two
	 * equally-valid tasks on a re-sort.
	 */
	const nowSlot = computed<ViewSlot | null>(
		() =>
			slots.value.find(slot => slot.task.status === PlannerTaskStatus.InProgress) ??
			slots.value.find(slot => slot.start <= nowOffset.value && slot.end > nowOffset.value) ??
			null,
	)

	/**
	 * The next block to start. A task whose window has passed while still `NotStarted` is neither now
	 * nor next — it is overdue, and saying so is `OverdueTasksBanner`'s job, not this one's.
	 */
	const nextSlot = computed<ViewSlot | null>(() => {
		const current = nowSlot.value
		return slots.value.find(slot => slot !== current && slot.start > nowOffset.value) ?? null
	})

	const nowTask = computed<PlannerTask | null>(() => nowSlot.value?.task ?? null)
	const nextTask = computed<PlannerTask | null>(() => nextSlot.value?.task ?? null)

	/** Null once the current task has outstayed its slot — there is nothing honest left to count down. */
	const minutesLeft = computed<number | null>(() => {
		if (nowSlot.value === null) return null
		const left = nowSlot.value.end - nowOffset.value
		return left > 0 ? left : null
	})

	const minutesUntilNext = computed<number | null>(() =>
		nextSlot.value === null ? null : nextSlot.value.start - nowOffset.value,
	)

	/** False on any day but today, and on a day with nothing left to say. Render nothing, not an empty state. */
	const isShown = computed(() => nowTask.value !== null || nextTask.value !== null)

	return {
		isShown,
		nowTask,
		minutesLeft,
		nextTask,
		minutesUntilNext,
	}
}

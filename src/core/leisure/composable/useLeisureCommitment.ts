import type { RouteLocationRaw } from 'vue-router'
import { Time } from '@/_common/dto/dto/Time.ts'
import { isoDateInUserZone, timeInUserZone } from '@/_common/composable/general/useUserClock.ts'
import { usStringToUrlString } from '@/_common/utils/DateTimeHelper.ts'
import { PlannerTaskRequest } from '@/core/dayPlanner/dto/request/PlannerTaskRequest.ts'
import { PlannerTaskStatus } from '@/core/dayPlanner/dto/enum/PlannerTaskStatus.ts'
import { useTaskPlannerCrud } from '@/core/dayPlanner/api/plannerTaskApi.ts'
import { useTaskImportanceCrud } from '@/core/dayPlanner/api/taskImportanceApi.ts'
import {
	MIN_SLOT_MINUTES,
	slotMinutesFor,
	type PickerConstraints,
} from '@/core/leisure/composable/pickerConstraints.ts'
import { useLeisureSuggestionApi } from '@/core/leisure/api/leisureSuggestionApi.ts'
import type { LeisureSuggestion } from '@/core/leisure/dto/response/LeisureSuggestion.ts'

/**
 * The follow-through. A suggestion the user reads and forgets is worth nothing — Gollwitzer (1999):
 * the effect lives in the implementation intention ("at 19:00, I will do Y"), not in the intention.
 * So the card's actions do not bookmark or favourite anything; they book a slot in today's plan.
 *
 * Two shapes, and the difference is only the start time and the status:
 *
 * - **do it now** — a slot starting at this minute, already `InProgress` with `actualStartTime` set,
 *   which is what the planner and the home now-bar read to show something as under way. It closes
 *   itself when the slot ends (`autoCompleteAtEnd`).
 * - **plan it for later today** — a slot at a time the user picks, left `NotStarted`.
 *
 * Cross-module by way of `dayPlanner/api` and `dayPlanner/dto` only, which is the boundary
 * `CLAUDE.md` allows and the same one `home/` and `todoList/` already cross.
 */

/** Wall-clock minutes in a day, minus one: the last minute a task can end on. */
const LAST_MINUTE_OF_DAY = 24 * 60 - 1
/** "Now" rounds up to this grid, so a booked slot reads as a plan rather than as a timestamp. */
const START_GRID_MINUTES = 5

export interface PlannedSlot {
	startTime: Time
	endTime: Time
}

/**
 * `PlannerTaskRequest.date` is a *calendar day*, so it is built from browser-local fields — that is
 * what `formatDateForApi` round-trips and what the planner's own dialog sends. The day itself is
 * resolved in the user's zone, not the browser's, so a traveller books against the same day the
 * server will.
 */
function todayAsCalendarDate(): Date {
	const [year, month, day] = isoDateInUserZone().split('-').map(Number)
	return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1)
}

/** Where "open it in the planner" goes. `dayPlanner` takes a DD-MM-YYYY path segment. */
export function todayPlannerRoute(): RouteLocationRaw {
	return { name: 'dayPlanner', params: { date: usStringToUrlString(isoDateInUserZone()) } }
}

function slotFrom(startMinutes: number, lengthMinutes: number): PlannedSlot {
	const end = Math.min(startMinutes + lengthMinutes, LAST_MINUTE_OF_DAY)
	// Late enough in the evening the slot runs out of day. Keep it plannable by pulling the start
	// back rather than booking a one-minute task.
	const start = Math.max(Math.min(startMinutes, end - MIN_SLOT_MINUTES), 0)
	return { startTime: Time.fromMinutes(start), endTime: Time.fromMinutes(end) }
}

export function useLeisureCommitment() {
	const { create } = useTaskPlannerCrud()
	const { fetchAll: fetchImportances } = useTaskImportanceCrud()
	const { recordSeen } = useLeisureSuggestionApi()

	/**
	 * Rest is booked as **optional**, so it can never cost the user their planner streak. Booked with no
	 * importance it counted as a commitment: an unticked rest block made the next day's streak read 0,
	 * and "do it now" starts the task `InProgress` with nothing that ever completes it. Silent and
	 * non-fatal — without the marker row the slot is still worth booking, just as it was before.
	 */
	async function optionalImportanceId(): Promise<number | null> {
		try {
			const importances = await fetchImportances({ _silent: true })
			return importances.find(importance => importance.isOptionalMarker)?.id ?? null
		} catch {
			return null
		}
	}

	/**
	 * Books the slot and returns it, so the card can say what it just did. Throws on failure — the
	 * axios interceptor raises the snackbar, and the caller leaves the card in its offered state.
	 */
	async function commit(
		suggestion: LeisureSuggestion,
		constraints: PickerConstraints,
		startTime: Time | null,
	): Promise<PlannedSlot> {
		const now = new Date()
		const nowTime = timeInUserZone(now)
		const isStartingNow = startTime === null
		const startMinutes = isStartingNow
			? Math.min(Math.ceil(nowTime.getInMinutes / START_GRID_MINUTES) * START_GRID_MINUTES, LAST_MINUTE_OF_DAY)
			: startTime.getInMinutes

		const slot = slotFrom(startMinutes, slotMinutesFor(suggestion, constraints))

		const request = new PlannerTaskRequest(slot.startTime, slot.endTime)
		request.activityId = suggestion.activityId
		request.importanceId = await optionalImportanceId()
		request.date = todayAsCalendarDate()
		if (isStartingNow) {
			request.status = PlannerTaskStatus.InProgress
			// The real minute, not the rounded slot start — this is a record of when work began.
			request.actualStartTime = nowTime
			// Rest does not need a tick to have happened. Without this the block stayed in progress for good,
			// holding the now-bar all day and counting as "never happened" in the plan-vs-actual trend.
			request.autoCompleteAtEnd = true
		}

		await create(request)
		// The server reads the committed row's effort type back off the profile, so the key is all it needs.
		// Never rejects: the block is booked either way.
		await recordSeen([suggestion.key], 'committed')
		return slot
	}

	return { commit }
}

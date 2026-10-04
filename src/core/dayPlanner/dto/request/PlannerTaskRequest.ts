import type { PlannerTask } from '@/core/dayPlanner/dto/response/PlannerTask.ts'
import { Time } from '@/_common/dto/dto/Time.ts'
import { timeInUserZone } from '@/_common/composable/general/useUserClock.ts'
import type { IBasePlannerTaskRequest } from '@/core/dayPlanner/dto/request/IBasePlannerTaskRequest.ts'
import { PlannerTaskStatus } from '@/core/dayPlanner/dto/enum/PlannerTaskStatus.ts'
import { formatDateForApi } from '@/_common/utils/DateTimeHelper.ts'

export class PlannerTaskRequest implements IBasePlannerTaskRequest {
	/**
	 * The day the task is created for. Only set when the dialog shows its own date picker (creating
	 * from outside the viewed day, e.g. from the to-do list); left undefined otherwise, so it stays
	 * out of the request body. Declared here because `PlannerTaskDialog` assigns it.
	 */
	date?: Date

	/**
	 * The task completes itself once its slot ends, if it is in progress by then — for blocks that do not
	 * need a tick to have happened (rest booked with the leisure picker's "do it now"). Create-only: the
	 * server ignores it on a PUT, so a full update can never switch it off by omission.
	 */
	autoCompleteAtEnd = false

	constructor(
		public startTime: Time = new Time(7, 0),
		public endTime: Time = new Time(8, 0),
		public calendarId?: number,
		public isBackground: boolean = false,
		public location: string | null = null,
		public notes: string | null = null,
		public activityId?: number,
		public importanceId: number | null = null,
		public status: PlannerTaskStatus = PlannerTaskStatus.NotStarted,
		/**
		 * The to-do item this task was planned from. Spelled as the server binds it (`TodolistId` on
		 * `PlannerTaskRequest.cs`), not like the response's `todolistItemId` or this app's
		 * `todoListItemId`: sent as `todoListItemId`, it matched nothing and was dropped, so no task was
		 * ever linked — and completing one never ticked its item.
		 *
		 * Also sent on every PUT, which writes it unconditionally: a request built with this `null`
		 * unlinks the task. `fromEntity` carries it over for that reason.
		 */
		public todolistId: number | null = null,
		public skipReason: string | null = null,
		public actualStartTime: Time | null = null,
		public actualEndTime: Time | null = null,
	) {}

	static createEmpty(): PlannerTaskRequest {
		// The user's zone, not the browser's: this prefills the times the user is about to plan
		// against, and they read the same clock the rest of the planner is drawn on.
		const now = timeInUserZone()
		const newHours = now.hours + 1
		const newMinutes = Math.ceil(now.minutes / 5) * 5
		return new PlannerTaskRequest(
			new Time(now.hours, newMinutes),
			new Time(newHours === 24 ? 0 : newHours, newMinutes),
		)
	}

	static fromSpan(startTime: Time, endTime: Time): PlannerTaskRequest {
		return new PlannerTaskRequest(startTime, endTime)
	}

	/**
	 * `date` goes out as `YYYY-MM-DD`, never as the `Date` itself. A local-midnight `Date` serialises to
	 * the UTC instant before it (`2026-10-03T22:00:00Z` for 4 October in Bratislava), and the server's
	 * `DateOnly` converter resolves that in the *server's* zone — the right day only while the API
	 * happens to run in the user's zone, the day before in a UTC container.
	 */
	toJSON() {
		return { ...this, date: this.date ? formatDateForApi(this.date) : undefined }
	}

	static fromEntity(entity: PlannerTask): PlannerTaskRequest {
		return new PlannerTaskRequest(
			entity.startTime,
			entity.endTime,
			entity.calendarId,
			entity.isBackground,
			entity.location ?? null,
			entity.notes ?? null,
			entity.activity.id,
			entity.importance?.id ?? null,
			entity.status,
			entity.todoListItemId ?? null,
			entity.skipReason,
			entity.actualStartTime,
			entity.actualEndTime,
		)
	}
}

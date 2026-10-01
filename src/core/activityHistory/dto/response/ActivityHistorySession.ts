import { convertToEnum } from '@/_common/utils/enumHelpers.ts'
import { TimerSessionKind } from '@/core/activityHistory/dto/enum/TimerSessionKind.ts'
import { TimerSessionOutcome } from '@/core/activityHistory/dto/enum/TimerSessionOutcome.ts'

/**
 * The timer session a history row belongs to. The server repeats the same object on every row of the
 * session, so the timeline groups a day's rows by `id` with no second request.
 */
export class ActivityHistorySession {
	constructor(
		public id: number,
		public kind: TimerSessionKind,
		public outcome: TimerSessionOutcome,
		/** Null for a countdown, which has no focus periods. */
		public plannedFocusPeriods: number | null,
		public completedFocusPeriods: number | null,
	) {}

	static fromJson(object: any) {
		const { id = 0, kind, outcome, plannedFocusPeriods = null, completedFocusPeriods = null } = object
		return new ActivityHistorySession(
			id,
			convertToEnum(TimerSessionKind, kind) ?? TimerSessionKind.Pomodoro,
			convertToEnum(TimerSessionOutcome, outcome) ?? TimerSessionOutcome.Completed,
			plannedFocusPeriods,
			completedFocusPeriods,
		)
	}
}

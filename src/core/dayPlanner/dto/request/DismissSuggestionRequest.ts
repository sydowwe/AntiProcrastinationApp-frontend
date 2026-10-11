import { DayOfWeek } from '@/_common/dto/enum/DayOfWeek.ts'
import { RecurrenceType } from '@/core/dayPlanner/dto/enum/RecurrenceType.ts'
import type { SuggestionResponse } from '@/core/dayPlanner/dto/response/SuggestionResponse.ts'

/**
 * Body of `POST /repeating-planner-task/suggestions/dismiss` (FO11) — the pattern a suggestion row came from.
 * `patternValue` is the ISO weekday (1 = Monday … 7 = Sunday) or the day of the month, as the server's
 * pattern views key it.
 */
export class DismissSuggestionRequest {
	constructor(
		public activityId: number = 0,
		public patternType: RecurrenceType.DayOfWeek | RecurrenceType.DayOfMonth = RecurrenceType.DayOfWeek,
		public patternValue: number = 1,
	) {}

	/**
	 * The pattern behind an automatic suggestion, read off the fields the row already carries: a pattern row has
	 * exactly one weekday in `scheduledDays` or one date in `scheduledDates`. `null` for a user-set row, which is
	 * the user's own recurrence and is deleted rather than dismissed.
	 */
	static fromSuggestion(suggestion: SuggestionResponse): DismissSuggestionRequest | null {
		if (!suggestion.isAutomatic) {
			return null
		}
		if (suggestion.recurrenceType === RecurrenceType.DayOfWeek) {
			const isoDay = Object.values(DayOfWeek).indexOf(suggestion.scheduledDays[0]) + 1
			return isoDay > 0
				? new DismissSuggestionRequest(suggestion.activity.id, RecurrenceType.DayOfWeek, isoDay)
				: null
		}
		if (suggestion.recurrenceType === RecurrenceType.DayOfMonth) {
			const day = suggestion.scheduledDates[0]
			return day !== undefined
				? new DismissSuggestionRequest(suggestion.activity.id, RecurrenceType.DayOfMonth, day)
				: null
		}
		return null
	}

	static fromJson(json: any): DismissSuggestionRequest {
		const { activityId = 0, patternType = RecurrenceType.DayOfWeek, patternValue = 1 } = json
		return new DismissSuggestionRequest(activityId, patternType, patternValue)
	}
}

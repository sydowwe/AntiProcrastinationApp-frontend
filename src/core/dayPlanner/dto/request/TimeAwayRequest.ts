import { DayType } from '@/_common/dto/enum/DayType.ts'
import { formatDateForApi, parseDateFromApi } from '@/_common/utils/DateTimeHelper.ts'
import type { Location } from '@/core/dayPlanner/dto/enum/Location.ts'
import type { TimeAway } from '@/core/dayPlanner/dto/response/TimeAway.ts'

/**
 * Body of `POST /time-away` and `PUT /time-away/{id}` — the same shape both ways, since a PUT is how a
 * stretch is renamed, resized or re-kinded. Both dates are inclusive.
 */
export class TimeAwayRequest {
	constructor(
		public name: string = '',
		/** `Vacation` or `SickDay`. */
		public kind: DayType = DayType.Vacation,
		public startDate: Date | null = null,
		public endDate: Date | null = null,
		public templateId: number | null = null,
		public location: Location | null = null,
		public notes: string | null = null,
	) {}

	// `DateOnly` on the server, so the days go out as `YYYY-MM-DD` — see `CalendarFilter.toJSON` for why
	// a raw `Date` would not do.
	toJSON() {
		return {
			name: this.name.trim(),
			kind: this.kind,
			startDate: this.startDate ? formatDateForApi(this.startDate) : null,
			endDate: this.endDate ? formatDateForApi(this.endDate) : null,
			templateId: this.templateId,
			location: this.location,
			notes: this.notes?.trim() ? this.notes.trim() : null,
		}
	}

	static fromTimeAway(timeAway: TimeAway): TimeAwayRequest {
		return new TimeAwayRequest(
			timeAway.name,
			timeAway.kind,
			timeAway.start,
			timeAway.end,
			timeAway.templateId,
			timeAway.location,
			timeAway.notes,
		)
	}

	static fromJson(json: any): TimeAwayRequest {
		const {
			name = '',
			kind = DayType.Vacation,
			startDate = null,
			endDate = null,
			templateId = null,
			location = null,
			notes = null,
		} = json
		return new TimeAwayRequest(
			name,
			kind,
			parseDateFromApi(startDate),
			parseDateFromApi(endDate),
			templateId,
			location,
			notes,
		)
	}
}

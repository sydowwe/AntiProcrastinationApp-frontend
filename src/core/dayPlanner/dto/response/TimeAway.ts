import { DayType } from '@/_common/dto/enum/DayType.ts'
import { convertToEnum } from '@/_common/utils/enumHelpers.ts'
import { daysBetween, parseDateFromApi } from '@/_common/utils/DateTimeHelper.ts'
import { Location } from '@/core/dayPlanner/dto/enum/Location.ts'

/**
 * A named stretch of time away (F4-02): "Barcelona, 12–20 Aug". `GET /time-away/{id}` and each row of
 * `POST /time-away/filter`. The stretch stamps its kind onto its days on the server; the client only
 * shows it and edits it. It carries no count of any kind, and nothing here should add one.
 */
export class TimeAway {
	constructor(
		public readonly id: number,
		public readonly name: string,
		/** `Vacation` or `SickDay`. */
		public readonly kind: DayType,
		/** First day, inclusive, `YYYY-MM-DD`. */
		public readonly startDate: string,
		/** Last day, inclusive, `YYYY-MM-DD`. */
		public readonly endDate: string,
		/** Suggested first on the stretch's days, never applied by it (F4 Q8). */
		public readonly templateId: number | null,
		public readonly templateName: string | null,
		public readonly location: Location | null,
		public readonly notes: string | null,
	) {}

	get start(): Date | null {
		return parseDateFromApi(this.startDate)
	}

	get end(): Date | null {
		return parseDateFromApi(this.endDate)
	}

	/** Both ends count: 12–20 Aug is nine days. */
	get lengthInDays(): number {
		const start = this.start
		const end = this.end
		return start && end ? daysBetween(start, end) + 1 : 0
	}

	static fromJson(json: any): TimeAway {
		const {
			id,
			name = '',
			kind,
			startDate,
			endDate,
			templateId = null,
			templateName = null,
			location = null,
			notes = null,
		} = json
		return new TimeAway(
			id,
			name,
			convertToEnum(DayType, kind) ?? DayType.Vacation,
			startDate,
			endDate,
			templateId,
			templateName,
			location == null ? null : (convertToEnum(Location, location) ?? null),
			notes,
		)
	}

	static listFromObjects(objects: any[]): TimeAway[] {
		return objects.map(item => TimeAway.fromJson(item))
	}
}

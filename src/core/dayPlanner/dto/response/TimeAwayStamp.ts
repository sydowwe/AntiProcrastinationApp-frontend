import { DayType } from '@/_common/dto/enum/DayType.ts'
import { convertToEnum } from '@/_common/utils/enumHelpers.ts'

/** One day a stretch now covers, as the stamp left it. */
export class TimeAwayDay {
	constructor(
		/** `YYYY-MM-DD`. */
		public readonly date: string,
		public readonly calendarId: number,
		public readonly dayType: DayType,
		/**
		 * The day already had a type of the user's own (`Special`, or a sick day inside a vacation) and
		 * kept it. It still belongs to the stretch. Not an error.
		 */
		public readonly keptOwnDayType: boolean,
	) {}

	static fromJson(json: any): TimeAwayDay {
		const { date, calendarId, dayType, keptOwnDayType = false } = json
		return new TimeAwayDay(date, calendarId, convertToEnum(DayType, dayType) ?? DayType.Workday, keptOwnDayType)
	}

	static listFromObjects(objects: any[]): TimeAwayDay[] {
		return objects.map(item => TimeAwayDay.fromJson(item))
	}
}

/** The answer to `POST /time-away` and `PUT /time-away/{id}`: what the stamp did to each day. */
export class TimeAwayStamp {
	constructor(
		public readonly id: number,
		public readonly days: TimeAwayDay[],
		/** Days the stretch no longer covers after a resize, `YYYY-MM-DD`. Always empty on a create. */
		public readonly releasedDates: string[],
	) {}

	get keptOwnDayTypeCount(): number {
		return this.days.filter(day => day.keptOwnDayType).length
	}

	static fromJson(json: any): TimeAwayStamp {
		const { id, days = [], releasedDates = [] } = json
		return new TimeAwayStamp(id, TimeAwayDay.listFromObjects(days), releasedDates)
	}
}

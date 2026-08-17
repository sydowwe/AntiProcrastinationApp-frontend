import { CalendarActivityRoleSummary } from '@/core/historyDashboard/dto/response/CalendarActivityRoleSummary.ts'
import { DayType } from '@/_common/dto/enum/DayType.ts'
import { convertToEnum } from '@/_common/utils/enumHelpers.ts'
import { Time } from '@/_common/dto/dto/Time.ts'
import { isTodayInUserZone } from '@/_common/composable/general/useUserClock.ts'

export class CalendarActivityDaySummary {
	constructor(
		public readonly id: number,
		public readonly date: string,
		public readonly dayType: DayType,
		public readonly dayIndex: number,
		public readonly label: string | null,
		public readonly holidayName: string | null,
		public readonly wakeUpTime: Time,
		public readonly bedTime: Time,
		public readonly totalSeconds: number,
		public readonly sessionCount: number,
		public readonly topRoles: CalendarActivityRoleSummary[],
	) {}

	get isToday() {
		// `date` is a calendar day (`YYYY-MM-DD` off the server), compared against what day it is
		// *now* — an instant read, so it must resolve in the user's zone, not UTC.
		return isTodayInUserZone(this.date)
	}

	get isWeekend() {
		return this.dayIndex === 6 || this.dayIndex === 7
	}

	static fromJson(json: any): CalendarActivityDaySummary {
		return new CalendarActivityDaySummary(
			json.id,
			json.date,
			convertToEnum(DayType, json.dayType),
			json.dayIndex,
			json.label ?? null,
			json.holidayName ?? null,
			Time.fromJson(json.wakeUpTime),
			Time.fromJson(json.bedTime),
			json.totalSeconds ?? 0,
			json.sessionCount ?? 0,
			json.topRoles?.map((r: any) => CalendarActivityRoleSummary.fromJson(r)) ?? [],
		)
	}
}

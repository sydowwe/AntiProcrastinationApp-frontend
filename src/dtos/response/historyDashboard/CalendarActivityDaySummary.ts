import {CalendarActivityRoleSummary} from '@/dtos/response/historyDashboard/CalendarActivityRoleSummary.ts'
import {DayType} from '@/dtos/enum/DayType.ts'
import {convertToEnum} from '@/composables/general/EnumComposable.ts'
import {Time} from '@/utils/Time.ts'

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
	) {
	}

	get isToday() {
		return this.date === new Date().toISOString().slice(0, 10)
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

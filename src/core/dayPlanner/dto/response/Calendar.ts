import { DayType } from '@/_common/dto/enum/DayType.ts'
import { convertToEnum } from '@/_common/utils/enumHelpers.ts'
import { Time } from '@/_common/dto/dto/Time.ts'
import { isTodayInUserZone } from '@/_common/composable/general/useUserClock.ts'
import type { Location } from '@/core/dayPlanner/dto/enum/Location.ts'

export class Calendar {
	constructor(
		public readonly id: number,
		public readonly date: string, // DateOnly -> ISO date string
		public readonly dayType: DayType, // DayType enum name
		public readonly dayIndex: number,
		public readonly label: string | null,
		public readonly holidayName: string | null,
		public readonly wakeUpTime: Time,
		public readonly bedTime: Time,
		public readonly appliedTemplateId: number | null,
		public readonly appliedTemplateName: string | null,
		public readonly weather: string | null,
		public readonly notes: string | null,
		public readonly totalTasks: number,
		public completedTasks: number,
		public readonly location: Location | null = null,
	) {}

	public get completionRate() {
		return this.totalTasks === 0 ? 0 : Math.round((this.completedTasks / this.totalTasks) * 100)
	}

	// Was `new Date().toISOString().slice(0, 10)`, which answers in UTC: for anyone west of
	// Greenwich this flipped to tomorrow during the evening, and east of it stayed on yesterday
	// through the early morning — regardless of their configured timezone.
	get isToday() {
		return isTodayInUserZone(this.date)
	}

	get isWeekend() {
		return this.dayIndex === 6 || this.dayIndex === 7
	}

	static fromJson(json: any): Calendar {
		return new Calendar(
			json.id,
			json.date,
			convertToEnum(DayType, json.dayType),
			json.dayIndex,
			json.label ?? null,
			json.holidayName ?? null,
			Time.fromJson(json.wakeUpTime),
			Time.fromJson(json.bedTime),
			json.appliedTemplateId ?? null,
			json.appliedTemplateName ?? null,
			json.weather ?? null,
			json.notes ?? null,

			json.totalTasks,
			json.completedTasks,
			json.location ?? null,
		)
	}
}

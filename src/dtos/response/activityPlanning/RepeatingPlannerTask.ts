import { Activity } from '@/dtos/response/activity/Activity.ts'
import { Time } from '@/dtos/dto/Time.ts'
import { TaskImportance } from '@/dtos/response/activityPlanning/TaskImportance.ts'
import { RecurrenceType } from '@/dtos/enum/RecurrenceType.ts'
import type { DayOfWeek } from '@/dtos/enum/DayOfWeek.ts'
import type { DayType } from '@/dtos/enum/DayType.ts'
import { convertToEnum } from '@/composables/general/EnumComposable.ts'

export class RepeatingPlannerTask {
	constructor(
		public id: number,
		public activity: Activity,
		public startTime: Time,
		public endTime: Time,
		public isBackground: boolean,
		public location: string | null,
		public notes: string | null,
		public importance: TaskImportance | null,
		public color: string,
		public isActive: boolean,
		public recurrenceType: RecurrenceType,
		public scheduledDays: DayOfWeek[],
		public scheduledDates: number[],
		public activeFromDate: string | null,
		public activeToDate: string | null,
		public scheduledForDayTypes: DayType[],
	) {}

	static fromJson(json: any): RepeatingPlannerTask {
		return new RepeatingPlannerTask(
			json.id,
			Activity.fromJson(json.activity),
			Time.fromJson(json.startTime),
			Time.fromJson(json.endTime),
			json.isBackground ?? false,
			json.location ?? null,
			json.notes ?? null,
			json.importance ? TaskImportance.fromJson(json.importance) : null,
			json.color ?? '',
			json.isActive ?? true,
			convertToEnum(RecurrenceType, json.recurrenceType),
			json.scheduledDays ?? [],
			json.scheduledDates ?? [],
			json.activeFromDate ?? null,
			json.activeToDate ?? null,
			json.scheduledForDayTypes ?? [],
		)
	}

	static listFromObjects(objects: any[]): RepeatingPlannerTask[] {
		return objects.map((item: any) => RepeatingPlannerTask.fromJson(item))
	}
}

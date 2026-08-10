import { Activity } from '@/core/activity/dto/response/Activity.ts'
import { Time } from '@/_common/dto/dto/Time.ts'
import { TaskImportance } from '@/core/dayPlanner/dto/response/TaskImportance.ts'
import { RecurrenceType } from '@/core/dayPlanner/dto/enum/RecurrenceType.ts'
import type { DayOfWeek } from '@/_common/dto/enum/DayOfWeek.ts'
import type { DayType } from '@/_common/dto/enum/DayType.ts'
import { convertToEnum } from '@/_common/utils/enumHelpers.ts'

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

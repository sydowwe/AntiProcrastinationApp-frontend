import { Time } from '@/dtos/dto/Time.ts'
import { RecurrenceType } from '@/dtos/enum/RecurrenceType.ts'
import type { DayOfWeek } from '@/dtos/enum/DayOfWeek.ts'
import type { DayType } from '@/dtos/enum/DayType.ts'
import type { RepeatingPlannerTask } from '@/dtos/response/activityPlanning/RepeatingPlannerTask.ts'

export class RepeatingPlannerTaskRequest {
	constructor(
		public startTime: Time = new Time(7, 0),
		public endTime: Time = new Time(8, 0),
		public activityId?: number,
		public isBackground: boolean = false,
		public location: string | null = null,
		public notes: string | null = null,
		public importanceId: number | null = null,
		public isActive: boolean = true,
		public recurrenceType: RecurrenceType = RecurrenceType.DayOfWeek,
		public scheduledDays: DayOfWeek[] = [],
		public scheduledDates: number[] = [],
		public activeFromDate: string | null = null,
		public activeToDate: string | null = null,
		public scheduledForDayTypes: DayType[] = [],
	) {}

	static fromEntity(task: RepeatingPlannerTask): RepeatingPlannerTaskRequest {
		return new RepeatingPlannerTaskRequest(
			task.startTime,
			task.endTime,
			task.activity.id,
			task.isBackground,
			task.location,
			task.notes,
			task.importance?.id ?? null,
			task.isActive,
			task.recurrenceType,
			task.scheduledDays,
			task.scheduledDates,
			task.activeFromDate,
			task.activeToDate,
			task.scheduledForDayTypes,
		)
	}
}

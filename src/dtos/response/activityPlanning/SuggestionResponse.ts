import { Activity } from '@/dtos/response/activity/Activity.ts'
import { Time } from '@/dtos/dto/Time.ts'
import { TaskImportance } from '@/dtos/response/activityPlanning/TaskImportance.ts'
import { RecurrenceType } from '@/dtos/enum/RecurrenceType.ts'
import type { DayOfWeek } from '@/dtos/enum/DayOfWeek.ts'
import type { DayType } from '@/dtos/enum/DayType.ts'
import { convertToEnum } from '@/composables/general/EnumComposable.ts'

export type SuggestionSourceType = 'UserSet' | 'PlannedPattern' | 'HistoryPattern'

export class SuggestionResponse {
	constructor(
		public repeatingPlannerTaskId: number | null,
		public activity: Activity,
		public importance: TaskImportance | null,
		public startTime: Time,
		public endTime: Time,
		public isBackground: boolean,
		public location: string | null,
		public notes: string | null,
		public color: string,
		public recurrenceType: RecurrenceType,
		public scheduledDays: DayOfWeek[],
		public scheduledDates: number[],
		public activeFromDate: string | null,
		public activeToDate: string | null,
		public scheduledForDayTypes: DayType[],
		public sourceType: SuggestionSourceType,
		public occurrenceCount: number | null,
	) {}

	get key(): string {
		if (this.repeatingPlannerTaskId !== null) {
			return `rpt_${this.repeatingPlannerTaskId}`
		}
		return `auto_${this.activity.id}_${this.startTime.getString()}_${this.sourceType}`
	}

	get isAutomatic(): boolean {
		return this.sourceType !== 'UserSet'
	}

	static fromJson(json: any): SuggestionResponse {
		return new SuggestionResponse(
			json.repeatingPlannerTaskId ?? null,
			Activity.fromJson(json.activity),
			json.importance ? TaskImportance.fromJson(json.importance) : null,
			Time.fromJson(json.startTime),
			Time.fromJson(json.endTime),
			json.isBackground ?? false,
			json.location ?? null,
			json.notes ?? null,
			json.color ?? '',
			convertToEnum(RecurrenceType, json.recurrenceType),
			json.scheduledDays ?? [],
			json.scheduledDates ?? [],
			json.activeFromDate ?? null,
			json.activeToDate ?? null,
			json.scheduledForDayTypes ?? [],
			json.sourceType as SuggestionSourceType,
			json.occurrenceCount ?? null,
		)
	}

	static listFromObjects(objects: any[]): SuggestionResponse[] {
		return objects.map((item: any) => SuggestionResponse.fromJson(item))
	}
}

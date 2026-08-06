import type { Activity } from '@/core/activity/dto/response/Activity.ts'
import type { Time } from '@/_common/dto/dto/Time.ts'
import type { IBasePlannerTaskRequest } from '@/core/dayPlanner/dto/request/IBasePlannerTaskRequest.ts'
import type { TaskImportance } from '@/core/dayPlanner/dto/response/TaskImportance.ts'

export interface IBasePlannerTask<TRequest extends IBasePlannerTaskRequest> {
	id: number
	startTime: Time
	endTime: Time
	isBackground: boolean
	activity: Activity
	location: string | null
	notes: string | null
	importance: TaskImportance | null
	color: string

	// Grid positioning (added for UI)
	gridRowStart: number
	gridRowEnd: number
	isDuringBackgroundTask: boolean

	isTaskOneRow: boolean
	toRequest(): TRequest
}

export class TaskSpan {
	constructor(
		public startTime: Time,
		public endTime: Time,
	) {}

	static fromTask(task: IBasePlannerTask<any>) {
		return new TaskSpan(task.startTime, task.endTime)
	}
}

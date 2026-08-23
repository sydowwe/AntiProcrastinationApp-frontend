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

/**
 * The widest planner task: every concrete task type is assignable to it, because `TRequest` only
 * ever appears in a return position. Use this wherever code touches the shared task surface and
 * does not care which planner the task came from — it is what lets one non-generic store contract
 * serve both planners (see `AnyDayPlannerStore`).
 */
export type AnyPlannerTask = IBasePlannerTask<IBasePlannerTaskRequest>

export class TaskSpan {
	constructor(
		public startTime: Time,
		public endTime: Time,
	) {}

	static fromTask(task: AnyPlannerTask) {
		return new TaskSpan(task.startTime, task.endTime)
	}
}

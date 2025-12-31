import type {Activity} from '@/dtos/response/Activity.ts';
import type {TaskPriority} from '@/dtos/response/activityPlanning/TaskPriority.ts';
import type {Time} from '@/utils/Time.ts';
import type {IBasePlannerTaskRequest} from '@/dtos/request/activityPlanning/IBasePlannerTaskRequest.ts';

export interface IBasePlannerTask<TRequest extends IBasePlannerTaskRequest> {
	id: number;
	startTime: Time;
	endTime: Time;
	isBackground: boolean;
	isOptional: boolean;
	activity: Activity;
	location: string | null;
	notes: string | null;
	priority: TaskPriority | null;
	// Grid positioning (added for UI)
	gridRowStart: number;
	gridRowEnd: number;
	isDuringBackgroundEvent: boolean;

	toRequest(): TRequest;
}

export class TaskSpan {
	constructor(
		public startTime: Time,
		public endTime: Time
	) {
	}

	static fromTask(task: IBasePlannerTask<any>) {
		return new TaskSpan(task.startTime, task.endTime);
	}
}
import type {Activity} from '@/dtos/response/activity/Activity.ts';
import type {Time} from '@/dtos/dto/Time.ts';
import type {IBasePlannerTaskRequest} from '@/dtos/request/activityPlanning/IBasePlannerTaskRequest.ts';
import type {TaskImportance} from '@/dtos/response/activityPlanning/TaskImportance.ts';

export interface IBasePlannerTask<TRequest extends IBasePlannerTaskRequest> {
	id: number;
	startTime: Time;
	endTime: Time;
	isBackground: boolean;
	activity: Activity;
	location: string | null;
	notes: string | null;
	importance: TaskImportance | null;
	color: string;

	// Grid positioning (added for UI)
	gridRowStart: number;
	gridRowEnd: number;
	isDuringBackgroundTask: boolean;

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
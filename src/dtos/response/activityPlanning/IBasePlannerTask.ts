import type {Activity} from '@/dtos/response/Activity.ts';
import type {TaskPriority} from '@/dtos/response/activityPlanning/TaskPriority.ts';
import type {Time} from '@/utils/Time.ts';

export interface IBasePlannerTask {
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
}
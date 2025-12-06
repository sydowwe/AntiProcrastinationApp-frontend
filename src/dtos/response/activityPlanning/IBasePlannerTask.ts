import type {Activity} from '@/dtos/response/Activity.ts';
import type {TaskPriority} from '@/dtos/response/activityPlanning/TaskPriority.ts';

export interface IBasePlannerTask {
	id: number;
	startTime: string;
	endTime: string;
	isBackground: boolean;
	isOptional: boolean;
	activity: Activity;
	location?: string;
	notes?: string;
	priority?: TaskPriority;
	// Grid positioning (added for UI)
	gridRowStart?: number;
	gridRowEnd?: number;
	isDuringBackgroundEvent?: boolean;
}
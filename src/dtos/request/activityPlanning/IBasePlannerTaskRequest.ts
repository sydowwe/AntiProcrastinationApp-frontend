import type {Time} from '@/utils/Time.ts';

export interface IBasePlannerTaskRequest {
	startTime?: Time;
	endTime?: Time;
	activityId?: number;
	isBackground: boolean;
	isOptional: boolean;
	isDone: boolean;
	location: string | null;
	notes: string | null;
	priorityId: number | null;
}

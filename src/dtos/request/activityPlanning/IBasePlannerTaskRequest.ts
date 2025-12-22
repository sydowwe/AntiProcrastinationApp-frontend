import type {Time} from '@/utils/Time.ts';

export interface IBasePlannerTaskRequest {
	startTime?: Time;
	endTime?: Time;
	isBackground?: boolean;
	isOptional?: boolean;
	activityId?: number;
	location: string | null;
	notes: string | null;
	priorityId?: number | null;
}
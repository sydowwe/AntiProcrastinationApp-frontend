import type {Time} from '@/utils/Time.ts';

export interface IBasePlannerTaskRequest {
	startTime?: Time;
	endTime?: Time;
	activityId?: number;
	isBackground: boolean;
	isOptional: boolean;
	location: string | null;
	notes: string | null;
	importanceId: number | null;
}

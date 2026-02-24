import type {Time} from '@/dtos/dto/Time.ts';

export interface IBasePlannerTaskRequest {
	startTime?: Time;
	endTime?: Time;
	activityId?: number;
	isBackground: boolean;
	location: string | null;
	notes: string | null;
	importanceId: number | null;
	color: string | null;
}

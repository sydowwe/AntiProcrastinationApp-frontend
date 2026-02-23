import {Activity} from '@/dtos/response/activity/Activity.ts';

export interface IBaseToDoListItem {
	id: number;
	activity: Activity;
	isDone: boolean;
	doneCount: number | null;
	totalCount: number | null;

	isMultipleCount: boolean;
}
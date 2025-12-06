import {Activity} from '@/dtos/response/Activity.ts';

export interface IBaseToDoListItem {
	id: number;
	activity: Activity;
	isDone: boolean;
	doneCount: number | null;
	totalCount: number | null;
}
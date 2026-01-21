import {ActivityFormRequest} from '@/dtos/request/ActivityFormRequest.ts';

export class ActivityHistoryFilter {
	public activityFilter: ActivityFormRequest = ActivityFormRequest.createEmpty;
	public dateFrom: Date | null;
	public dateTo: Date | null;
	public hoursBack: number | undefined;

	constructor(
		activityId: number | null = null,
		roleId: number | null = null,
		categoryId: number | null = null,
		isFromToDoList: boolean | null = null,
		taskPriorityId: number | null = null,
		isFromRoutineToDoList: boolean | null = null,
		routineTimePeriodId: number | null = null,
		isUnavoidable: boolean | null = null,
		dateFrom: Date | null = null,
		dateTo: Date | null = new Date(),
		hoursBack: number | undefined = 24
	) {
		this.activityFilter = new ActivityFormRequest(activityId, roleId, categoryId, isUnavoidable, isFromToDoList, taskPriorityId, isFromRoutineToDoList, routineTimePeriodId);
		const tmp = new Date();
		tmp.setDate(new Date().getDate() - 3);
		this.dateFrom = dateFrom ?? tmp;
		this.dateTo = dateTo;
		this.hoursBack = hoursBack;
	}
}
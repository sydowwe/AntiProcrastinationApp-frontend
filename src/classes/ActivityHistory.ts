import {Activity} from './Activity';
import {TimeLengthObject, TimeObject} from '@/classes/TimeUtils';
import {ActivityFormRequest} from '@/classes/ActivityFormHelper';

export class ActivityHistory {
	constructor(
		public id: number,
		public startTimestamp: Date,
		public length: TimeLengthObject,
		public activity: Activity,
	) {
	}

	static fromJson(object: any) {
		const {
			id = 0
		} = object;
		const startTimestamp = new Date(object.startTimestamp);
		const length = TimeLengthObject.fromJson(object.length);
		const activity = Activity.fromJson(object.activity);
		return new ActivityHistory(id, startTimestamp, length, activity);
	}

	static listFromObjects(objects: any[]) {
		return objects.map((item: object) => this.fromJson(item));
	}
}

export class ActivityHistoryRequest {
	constructor(
		public startTimestamp: Date,
		public length: TimeLengthObject,
		public activityId: number,
	) {
	}

	static fromJson(object: any) {
		const {
			startTimestamp = new Date(),
			length = new TimeObject(),
			activityId = 0
		} = object;
		return new ActivityHistoryRequest(startTimestamp, length, activityId);
	}

	static listFromObjects(objects: any[]) {
		return objects.map((item: object) => this.fromJson(item));
	}
}


export class ActivityHistoryFilter extends ActivityFormRequest {
	public dateFrom: Date | null;
	public dateTo: Date | null;
	public hoursBack: number | null;

	constructor(
		activityId: number | null = null,
		roleId: number | null = null,
		categoryId: number | null = null,
		isFromToDoList: boolean | null = null,
		taskUrgencyId: number | null = null,
		isFromRoutineToDoList: boolean | null = null,
		routineTimePeriodId: number | null = null,
		isUnavoidable: boolean | null = null,
		dateFrom: Date | null = null,
		dateTo: Date | null = new Date(),
		hoursBack: number | null = 24
	) {
		super(activityId, roleId, categoryId, isFromToDoList, taskUrgencyId, isFromRoutineToDoList, routineTimePeriodId, isUnavoidable);
		const tmp = new Date();
		tmp.setDate(new Date().getDate() - 3);
		this.dateFrom = dateFrom ?? tmp;
		this.dateTo = dateTo;
		this.hoursBack = hoursBack;
	}
}

export class HistoryGroupedByDate {
	constructor(
		public date: Date,
		public historyList: ActivityHistory[],
	) {
	}

	static fromJson(object: any) {
		const {} = object;
		const startTimestamp = new Date(object.date);
		const historyList = ActivityHistory.listFromObjects(object.historyResponseList);
		return new HistoryGroupedByDate(startTimestamp, historyList);
	}

	static listFromObjects(objects: any[]) {
		return objects.map((item: object) => this.fromJson(item));
	}
}

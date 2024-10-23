import {Activity} from './Activity';
import {TimeLengthObject} from '@/classes/TimeUtils';
import {ActivityFormRequest} from '@/classes/ActivityFormHelper';

export class History {
	constructor(
		public id: number,
		public startTimestamp: Date,
		public length: TimeLengthObject,
		public activity: Activity,
	) {
	}

	static fromObject(object: any) {
		const {
			id = 0
		} = object;
		const startTimestamp = new Date(object.startTimestamp);
		const length = TimeLengthObject.fromObject(object.length);
		const activity = Activity.fromObject(object.activity);
		return new History(id, startTimestamp, length, activity);
	}

	static listFromObjects(objects: any[]) {
		return objects.map((item: object) => this.fromObject(item));
	}
}

export class HistoryRequest {
	constructor(
		public startTimestamp: Date,
		public length: TimeLengthObject,
		public activityId: number,
	) {
	}

	static fromObject(object: any) {
		const {
			startTimestamp = new Date(),
			length = new TimeLengthObject(),
			activityId = 0
		} = object;
		return new HistoryRequest(startTimestamp, length, activityId);
	}

	static listFromObjects(objects: any[]) {
		return objects.map((item: object) => this.fromObject(item));
	}
}


export class HistoryFilter extends ActivityFormRequest {
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
		public historyList: History[],
	) {
	}

	static fromObject(object: any) {
		const {} = object;
		const startTimestamp = new Date(object.date);
		const historyList = History.listFromObjects(object.historyResponseList);
		return new HistoryGroupedByDate(startTimestamp, historyList);
	}

	static listFromObjects(objects: any[]) {
		return objects.map((item: object) => this.fromObject(item));
	}
}

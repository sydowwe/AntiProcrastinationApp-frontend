import {TaskUrgencyEntity} from './TaskUrgencyEntity';
import {Activity} from '@/classes/Activity';

export interface BaseToDoListItemEntity {
	id: number,
	activity: Activity,
	isDone: boolean,
}

export class BaseToDoListItemRequest {
	constructor(
		public activityId: number | null,
		public isDone: boolean,
	) {
	}

	static fromJson(object: any) {
		const {
			activityId = 0,
			isDone = false,
		} = object;
		return new BaseToDoListItemRequest(activityId, isDone);
	}

	static listFromObjects(objects: any[]) {
		return objects.map((item: object) => this.fromJson(item));
	}
}

export class ToDoListItemEntity implements BaseToDoListItemEntity {
	constructor(
		public id: number,
		public activity: Activity,
		public isDone: boolean,
		public taskUrgency: TaskUrgencyEntity,
	) {
	}

	static fromJson(object: any) {
		const {
			id = 0,
			activity = new Activity(),
			isDone = false,
			taskUrgency = new TaskUrgencyEntity(),
		} = object;
		return new ToDoListItemEntity(id, activity, isDone, taskUrgency);
	}

	static listFromObjects(objects: any[]) {
		return objects.map((item: object) => this.fromJson(item));
	}

	static frontEndSortFunction() {
		return (a: ToDoListItemEntity, b: ToDoListItemEntity) => {
			const priorityComparison = a.taskUrgency.priority - b.taskUrgency.priority;
			return priorityComparison !== 0 ? priorityComparison : a.id - b.id;
		};
	}
}

export class ToDoListItemRequest extends BaseToDoListItemRequest {
	constructor(
		public activityId: number | null = null,
		public taskUrgencyId: number | null = null,
		public isDone: boolean = false) {
		super(activityId, isDone);
	}

	static fromEntity(obj: ToDoListItemEntity): ToDoListItemRequest {
		return new ToDoListItemRequest(obj.activity.id, obj.taskUrgency.id, obj.isDone);
	}

	static fromJson(obj: any): ToDoListItemRequest {
		return new ToDoListItemRequest(obj.activity.id, obj.taskUrgencyId, obj.isDone);
	}
}


//=========================================================
export class RoutineToDoListItemEntity implements BaseToDoListItemEntity {
	constructor(
		public id: number,
		public activity: Activity,
		public isDone: boolean,
		public timePeriod: TimePeriodEntity,
	) {
	}

	static fromJson(object: any) {
		const {
			id = 0,
			activity = new Activity(),
			isDone = false,
			timePeriod = new TimePeriodEntity(),
		} = object;
		return new RoutineToDoListItemEntity(id, activity, isDone, timePeriod);
	}

	static listFromObjects(objects: any[]) {
		return objects.map((item: object) => this.fromJson(item));
	}
}

export class RoutineToDoListGroupedList {
	constructor(
		public timePeriod: TimePeriodEntity,
		public items: RoutineToDoListItemEntity[]) {
	}

	static fromJson(object: any) {
		const {
			timePeriod = new TimePeriodEntity(),
			items = [] as RoutineToDoListItemEntity[],
		} = object;
		return new RoutineToDoListGroupedList(timePeriod, items);
	}

	static listFromObjects(objects: any[]) {
		return objects.map((item: object) => this.fromJson(item));
	}
}

export class RoutineToDoListItemRequest extends BaseToDoListItemRequest {
	constructor(
		public activityId: number | null = null,
		public timePeriodId: number | null = null,
		public isDone: boolean = false) {
		super(activityId, isDone);
	}

	static fromEntity(obj: RoutineToDoListItemEntity): RoutineToDoListItemRequest {
		return new RoutineToDoListItemRequest(obj.activity.id, obj.timePeriod.id, obj.isDone);
	}

	static fromJson(obj: any): RoutineToDoListItemRequest {
		return new RoutineToDoListItemRequest(obj.activity.id, obj.timePeriodId, obj.isDone);
	}
}

export class TimePeriodEntity {
	constructor(
		public id: number = 0,
		public text: string | null = null,
		public color: string | undefined = undefined,
		public lengthInDays: number = 0,
		public isHiddenInView: boolean = false,
	) {
	}

	static fromJson(object: any) {
		const {
			id = 0,
			text = '',
			color = '',
			lengthInDays = 0,
			isHiddenInView = false,
		} = object;
		return new TimePeriodEntity(id, text, color, lengthInDays, isHiddenInView);
	}

	static listFromObjects(objects: any[]) {
		return objects.map((item: object) => this.fromJson(item));
	}
}

export enum ToDoListKind {
	ROUTINE,
	NORMAL
}
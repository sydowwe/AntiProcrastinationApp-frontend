import {TaskUrgencyEntity} from './TaskUrgencyEntity';
import {Activity} from '@/classes/Activity';
import {type ICreateRequest, IdResponse, type IUpdateRequest} from '@/classes/Generic.ts';

export type BaseToDoListItemEntity = TodoListItemEntity | RoutineTodoListItemEntity;

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

export class TodoListItemEntity {
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
		return new TodoListItemEntity(id, activity, isDone, taskUrgency);
	}

	static listFromObjects(objects: any[]) {
		return objects.map((item: object) => this.fromJson(item));
	}

	static frontEndSortFunction() {
		return (a: TodoListItemEntity, b: TodoListItemEntity) => {
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

	static fromEntity(obj: TodoListItemEntity): ToDoListItemRequest {
		return new ToDoListItemRequest(obj.activity.id, obj.taskUrgency.id, obj.isDone);
	}

	static fromJson(obj: any): ToDoListItemRequest {
		return new ToDoListItemRequest(obj.activity.id, obj.taskUrgencyId, obj.isDone);
	}
}


//=========================================================
export class RoutineTodoListItemEntity extends IdResponse {
	constructor(
		public id: number,
		public activity: Activity,
		public isDone: boolean,
		public timePeriod: TimePeriodEntity,
	) {
		super(id);
	}

	static fromJson(object: any) {
		const {
			id = 0,
			activity = new Activity(),
			isDone = false,
			timePeriod = new TimePeriodEntity(),
		} = object;
		return new RoutineTodoListItemEntity(id, activity, isDone, timePeriod);
	}

	static listFromObjects(objects: any[]) {
		return objects.map((item: object) => this.fromJson(item));
	}

}

export class RoutineTodoListGroupedList {
	constructor(
		public timePeriod: TimePeriodEntity,
		public items: RoutineTodoListItemEntity[]) {
	}

	static fromJson(object: any) {
		const {
			timePeriod = new TimePeriodEntity(),
			items = [] as RoutineTodoListItemEntity[],
		} = object;
		return new RoutineTodoListGroupedList(timePeriod, items);
	}

	static listFromObjects(objects: any[]) {
		return objects.map((item: object) => this.fromJson(item));
	}
}

export class RoutineTodoListItemRequest extends BaseToDoListItemRequest {
	constructor(
		public activityId: number | null = null,
		public timePeriodId: number | null = null,
		public isDone: boolean = false) {
		super(activityId, isDone);
	}

	static fromEntity(obj: RoutineTodoListItemEntity): RoutineTodoListItemRequest {
		return new RoutineTodoListItemRequest(obj.activity.id, obj.timePeriod.id, obj.isDone);
	}

	static fromJson(obj: any): RoutineTodoListItemRequest {
		return new RoutineTodoListItemRequest(obj.activity.id, obj.timePeriodId, obj.isDone);
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

export class TimePeriodRequest implements ICreateRequest, IUpdateRequest {
	constructor(
		public text: string | null = null,
		public color: string | undefined = undefined,
		public lengthInDays: number = 0,
		public isHiddenInView: boolean = false,
	) {
	}


}


export enum ToDoListKind {
	ROUTINE,
	NORMAL
}

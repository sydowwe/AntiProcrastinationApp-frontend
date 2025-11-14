import {TaskPriority} from './TaskPriority.ts';
import {Activity} from '@/classes/Activity';
import {type ICreateRequest, IdResponse, type IUpdateRequest} from '@/classes/Generic.ts';

export type BaseToDoListItemEntity = TodoListItemEntity | RoutineTodoListItemEntity;

export class BaseToDoListItemRequest {
	constructor(
		public isDone: boolean,
		public activityId?: number,
		public doneCount: number | null = null,
		public totalCount: number | null = null,
	) {
	}
}

export class TodoListItemEntity {
	constructor(
		public id: number,
		public activity: Activity,
		public isDone: boolean,
		public doneCount: number | null,
		public totalCount: number | null,
		public taskUrgency: TaskPriority,
	) {
	}

	get isMultipleCount() {
		return this.totalCount && this.totalCount !== 1;
	}

	static fromJson(json: any) {
		return new TodoListItemEntity(
			json.id,
			Activity.fromJson(json.activity),
			json.isDone,
			json.doneCount,
			json.totalCount,
			TaskPriority.fromJson(json.taskUrgency)
		);
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
		public activityId?: number,
		public taskUrgencyId?: number,
		public doneCount: number | null = null,
		public totalCount: number | null = null,
		public isDone: boolean = false) {
		super(isDone, activityId);
	}

	static fromEntity(obj: TodoListItemEntity): ToDoListItemRequest {
		return new ToDoListItemRequest(obj.activity.id, obj.taskUrgency.id,obj.doneCount, obj.totalCount, obj.isDone);
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
		public doneCount: number | null,
		public totalCount: number | null,
		public timePeriod: TimePeriodEntity,
	) {
		super(id);
	}

	get isMultipleCount() {
		return this.totalCount && this.totalCount !== 1;
	}

	static fromJson(json: any) {
		return new RoutineTodoListItemEntity(
			json.id,
			Activity.fromJson(json.activity),
			json.isDone,
			json.doneCount,
			json.totalCount,
			TimePeriodEntity.fromJson(json.routineTimePeriod)
		);
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

	static fromJson(json: any) {
		return new RoutineTodoListGroupedList(json.routineTimePeriod, RoutineTodoListItemEntity.listFromObjects(json.items));
	}

	static listFromObjects(objects: any[]) {
		return objects.map((item: object) => this.fromJson(item));
	}
}

export class RoutineTodoListItemRequest extends BaseToDoListItemRequest {
	constructor(
		public activityId?: number,
		public timePeriodId?: number,
		public doneCount: number | null = null,
		public totalCount: number | null = null,
		public isDone: boolean = false) {
		super(isDone, activityId);
	}

	static fromEntity(obj: RoutineTodoListItemEntity): RoutineTodoListItemRequest {
		return new RoutineTodoListItemRequest(obj.activity.id, obj.timePeriod.id, obj.doneCount, obj.totalCount, obj.isDone);
	}
}

export class TimePeriodEntity {
	constructor(
		public id: number = 0,
		public text: string | null = null,
		public color: string | undefined = undefined,
		public lengthInDays: number = 0,
		public isHidden: boolean = false,
	) {
	}

	static fromJson(object: any) {
		const {
			id = 0,
			text = '',
			color = '',
			lengthInDays = 0,
			isHidden = false,
		} = object;
		return new TimePeriodEntity(id, text, color, lengthInDays, isHidden);
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
		public isHidden: boolean = false,
	) {
	}


}

export class ChangeDisplayOrderRequest {
	constructor(
		public movedItemId: number,
		public precedingItemId: number | null = null,
		public followingItemId: number | null = null
	) {}
}

export enum ToDoListKind {
	ROUTINE,
	NORMAL
}

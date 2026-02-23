import {BaseToDoListItemRequest} from './BaseToDoListItemRequest.ts';
import {RoutineTodoListItemEntity} from '@/dtos/response/todoList/RoutineTodoListItemEntity.ts';

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

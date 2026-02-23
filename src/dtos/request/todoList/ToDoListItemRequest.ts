import {BaseToDoListItemRequest} from './BaseToDoListItemRequest.ts';
import {TodoListItemEntity} from '@/dtos/response/todoList/TodoListItemEntity.ts';

export class ToDoListItemRequest extends BaseToDoListItemRequest {
	constructor(
		public activityId?: number,
		public taskPriorityId?: number,
		public doneCount: number | null = null,
		public totalCount: number | null = null,
		public isDone: boolean = false) {
		super(isDone, activityId);
	}

	static fromEntity(obj: TodoListItemEntity): ToDoListItemRequest {
		return new ToDoListItemRequest(obj.activity.id, obj.taskPriority.id, obj.doneCount, obj.totalCount, obj.isDone);
	}

	static fromJson(obj: any): ToDoListItemRequest {
		return new ToDoListItemRequest(obj.activity.id, obj.taskPriorityId, obj.isDone);
	}
}

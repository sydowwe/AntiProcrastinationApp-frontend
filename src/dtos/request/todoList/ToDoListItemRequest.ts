import { BaseToDoListItemRequest } from './BaseToDoListItemRequest.ts'
import { TodoListItemEntity } from '@/dtos/response/todoList/TodoListItemEntity.ts'
import type { Time } from '@/dtos/dto/Time.ts'

export class ToDoListItemRequest extends BaseToDoListItemRequest {
	constructor(
		public activityId?: number,
		public taskPriorityId?: number,
		public doneCount: number | null = null,
		public totalCount: number | null = null,
		public isDone: boolean = false,
		public dueDate: string | null = null,
		public dueTime: Time | null = null,
		public note: string | null = null,
	) {
		super(isDone, activityId, doneCount, totalCount, note)
	}

	static fromEntity(obj: TodoListItemEntity): ToDoListItemRequest {
		return new ToDoListItemRequest(
			obj.activity.id,
			obj.taskPriority.id,
			obj.doneCount,
			obj.totalCount,
			obj.isDone,
			obj.dueDate,
			obj.dueTime,
			obj.note,
		)
	}

	static fromJson(obj: any): ToDoListItemRequest {
		return new ToDoListItemRequest(obj.activity.id, obj.taskPriorityId, obj.isDone)
	}
}

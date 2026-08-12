import { BaseToDoListItemRequest } from './BaseToDoListItemRequest.ts'
import type { TodoListItemEntity } from '@/core/todoList/dto/response/TodoListItemEntity.ts'
import type { Time } from '@/_common/dto/dto/Time.ts'
import { TodoListItemStepRequest } from '@/core/todoList/dto/request/TodoListItemStepRequest.ts'

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
		public suggestedTime: Time | null = null,
		public steps: TodoListItemStepRequest[] = [],
		/**
		 * Paired leisure reward, by activity id. Deliberately not on `BaseToDoListItemRequest` —
		 * routine items repeat on their own schedule and have their own reward loop (streaks,
		 * personal bests), so bundling belongs to the normal list only.
		 */
		public pairedLeisureActivityId: number | null = null,
	) {
		super(isDone, activityId, doneCount, totalCount, note, suggestedTime, steps)
	}

	static fromEntity(obj: TodoListItemEntity): ToDoListItemRequest {
		return new ToDoListItemRequest(
			obj.activity.id,
			obj.taskPriority.id,
			obj.doneCount,
			obj.steps.length > 0 ? null : obj.totalCount,
			obj.isDone,
			obj.dueDate,
			obj.dueTime,
			obj.note,
			obj.suggestedTime,
			obj.steps.map((s, i) => new TodoListItemStepRequest(s.name, i + 1, s.note)),
			obj.pairedLeisureActivityId,
		)
	}

	static fromJson(obj: any): ToDoListItemRequest {
		return new ToDoListItemRequest(obj.activity.id, obj.taskPriorityId, obj.isDone)
	}
}

import type { Time } from '@/dtos/dto/Time.ts'
import type { TodoListItemStepRequest } from '@/dtos/request/todoList/TodoListItemStepRequest.ts'

export class BaseToDoListItemRequest {
	constructor(
		public isDone: boolean,
		public activityId?: number,
		public doneCount: number | null = null,
		public totalCount: number | null = null,
		public note: string | null = null,
		public suggestedTime: Time | null = null,
		public steps: TodoListItemStepRequest[] = [],
	) {}
}

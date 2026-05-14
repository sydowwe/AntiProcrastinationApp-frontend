import { BaseToDoListItemRequest } from './BaseToDoListItemRequest.ts'
import type { RoutineTodoListItemEntity } from '@/dtos/response/todoList/routine/RoutineTodoListItemEntity.ts'
import type { Time } from '@/dtos/dto/Time.ts'
import { TodoListItemStepRequest } from '@/dtos/request/todoList/TodoListItemStepRequest.ts'
import type { DayOfWeek } from '@/dtos/enum/DayOfWeek.ts'

export class RoutineTodoListItemRequest extends BaseToDoListItemRequest {
	constructor(
		public activityId?: number,
		public timePeriodId?: number,
		public doneCount: number | null = null,
		public totalCount: number | null = null,
		public isDone: boolean = false,
		public note: string | null = null,
		public suggestedTime: Time | null = null,
		public suggestedDays: DayOfWeek[] = [],
		public suggestedDayOfMonth: number | null = null,
		public steps: TodoListItemStepRequest[] = [],
	) {
		super(isDone, activityId, doneCount, totalCount, note, suggestedTime, steps)
	}

	static fromEntity(obj: RoutineTodoListItemEntity): RoutineTodoListItemRequest {
		return new RoutineTodoListItemRequest(
			obj.activity.id,
			obj.timePeriod.id,
			obj.doneCount,
			obj.totalCount,
			obj.isDone,
			obj.note,
			obj.suggestedTime,
			obj.suggestedDays,
			obj.suggestedDayOfMonth,
			obj.steps.map((s, i) => new TodoListItemStepRequest(s.name, i + 1, s.note)),
		)
	}
}

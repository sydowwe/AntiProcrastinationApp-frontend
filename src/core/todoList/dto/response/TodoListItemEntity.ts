import { Activity } from '@/core/activity/dto/response/Activity.ts'
import type { IBaseToDoListItem } from '@/core/todoList/dto/response/interface/IBaseToDoListItem.ts'
import { Time } from '@/_common/dto/dto/Time.ts'
import { TaskPriority } from '@/core/todoList/dto/response/TaskPriority.ts'
import { TodoListItemStepEntity } from '@/core/todoList/dto/response/TodoListItemStepEntity.ts'

export class TodoListItemEntity implements IBaseToDoListItem {
	constructor(
		public id: number,
		public activity: Activity,
		public isDone: boolean,
		public doneCount: number | null,
		public totalCount: number | null,
		public taskPriority: TaskPriority,
		public dueDate: string | null = null,
		public dueTime: Time | null = null,
		public note: string | null = null,
		public suggestedTime: Time | null = null,
		public steps: TodoListItemStepEntity[] = [],
	) {}

	get isMultipleCount() {
		return !!this.totalCount && this.totalCount !== 1
	}

	static fromJson(json: any) {
		return new TodoListItemEntity(
			json.id,
			Activity.fromJson(json.activity),
			json.isDone,
			json.doneCount,
			json.totalCount,
			TaskPriority.fromJson(json.taskPriority),
			json.dueDate ?? null,
			json.dueTime ? Time.fromJson(json.dueTime) : null,
			json.note ?? null,
			json.suggestedTime ? Time.fromJson(json.suggestedTime) : null,
			TodoListItemStepEntity.listFromObjects(json.steps ?? []),
		)
	}

	static listFromObjects(objects: any[]) {
		return objects.map((item: object) => this.fromJson(item))
	}

	static frontEndSortFunction() {
		return (a: TodoListItemEntity, b: TodoListItemEntity) => {
			const priorityComparison = a.taskPriority.priority - b.taskPriority.priority
			return priorityComparison !== 0 ? priorityComparison : a.id - b.id
		}
	}
}

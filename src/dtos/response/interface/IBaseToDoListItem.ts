import type { Activity } from '@/dtos/response/activity/Activity.ts'
import type { Time } from '@/dtos/dto/Time.ts'
import type { TodoListItemStepEntity } from '@/dtos/response/todoList/TodoListItemStepEntity.ts'

export interface IBaseToDoListItem {
	id: number
	activity: Activity
	isDone: boolean
	doneCount: number | null
	totalCount: number | null
	note: string | null
	suggestedTime: Time | null
	steps: TodoListItemStepEntity[]

	isMultipleCount: boolean
}

import type { Activity } from '@/core/activity/dto/response/Activity.ts'
import type { Time } from '@/_common/dto/dto/Time.ts'
import type { TodoListItemStepEntity } from '@/core/todoList/dto/response/TodoListItemStepEntity.ts'

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

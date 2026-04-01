import type { Activity } from '@/dtos/response/activity/Activity.ts'

export interface IBaseToDoListItem {
	id: number
	activity: Activity
	isDone: boolean
	doneCount: number | null
	totalCount: number | null
	note: string | null

	isMultipleCount: boolean
}

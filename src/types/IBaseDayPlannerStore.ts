import type {Time} from '@/utils/Time.ts';
import {type IBasePlannerTask, TaskSpan} from '@/dtos/response/activityPlanning/IBasePlannerTask.ts';
import type {IBasePlannerTaskRequest} from '@/dtos/request/activityPlanning/IBasePlannerTaskRequest.ts';
import type {StoreGeneric} from 'pinia';

export interface IBaseDayPlannerStore<TTask extends IBasePlannerTask<TTaskRequest>, TTaskRequest extends IBasePlannerTaskRequest> extends StoreGeneric {
	// Time/Grid configuration
	timeSlotDuration: number
	viewStartTime: Time
	viewEndTime: Time

	// Time/Grid computed
	timeSlots: Time[]
	totalGridRows: number
	slotIndexToTime: (index: number) => Time
	timeToSlotIndex: (time: Time) => number

	// State
	tasks: TTask[]
	selectedTaskIds: Set<number>
	dialog: boolean
	editedId: number | undefined
	editingTask: TTaskRequest
	deleteDialog: boolean
	draggingTaskId: number | null
	resizingTaskId: number | null
	dragConflict: boolean

	// Computed
	selectedTasks: TTask[]
	showActionBar: boolean
	isOverMidnight: boolean
	isDraggingAny: boolean
	isResizingAny: boolean

	// Actions
	openDeleteDialog: () => void
	openCreateDialogPrefilled: (startTime: Time, endTime: Time) => void
	openCreateDialogEmpty: () => void
	openEditDialog: () => void
	toggleTaskSelection: (taskId: number) => void
	clearSelection: () => void

	setGridPositionFromSpan: (task: TTask) => void
	checkOverlapsBackground: (task: TTask) => boolean
	updateIsDuringBackgroundFlags: (task: TTask) => void
	checkConflict: (task: TTask, currentEventId?: number) => boolean
	initializeTaskGridPositions: () => void
	redrawTask: (taskId: number, updates: Partial<TTask>) => void

	updateTaskSpan: (taskId: number, span: TaskSpan) => Promise<void>
}
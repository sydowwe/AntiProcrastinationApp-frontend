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
	events: TTask[]
	selectedEventIds: Set<number>
	dialog: boolean
	editedId: number | undefined
	editingTask: TTaskRequest
	deleteDialog: boolean
	conflictSnackbar: boolean
	draggingEventId: number | null
	resizingEventId: number | null
	dragConflict: boolean

	// Computed
	selectedEvents: TTask[]
	showActionBar: boolean
	isOverMidnight: boolean
	isDraggingAny: boolean
	isResizingAny: boolean

	// Actions
	openDeleteDialog: () => void
	openCreateDialogPrefilled: (startTime: Time, endTime: Time) => void
	openCreateDialogEmpty: () => void
	openEditDialog: () => void
	toggleEventSelection: (eventId: number) => void
	clearSelection: () => void

	setGridPositionFromSpan: (event: TTask) => void
	checkOverlapsBackground: (start: Time, end: Time) => boolean
	checkConflict: (newStart: Time, newEnd: Time, currentEventId?: number) => boolean
	updateOverlapsBackgroundFlags: (bgStart: Time, bgEnd: Time) => void
	initializeEventGridPositions: () => void
	redrawTask: (eventId: number, updates: Partial<TTask>) => void

	updateTaskSpan: (eventId: number, span: TaskSpan) => Promise<void>
}
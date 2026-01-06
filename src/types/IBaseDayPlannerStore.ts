import type {Time} from '@/utils/Time.ts';
import {type IBasePlannerTask, TaskSpan} from '@/dtos/response/activityPlanning/IBasePlannerTask.ts';
import type {IBasePlannerTaskRequest} from '@/dtos/request/activityPlanning/IBasePlannerTaskRequest.ts';
import type {Ref} from 'vue';

export interface IBaseDayPlannerStore<TTask extends IBasePlannerTask<TTaskRequest>, TTaskRequest extends IBasePlannerTaskRequest> {
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
	editingEvent: TTaskRequest
	deleteDialog: boolean
	toDeleteId: number | null
	conflictSnackbar: boolean
	draggingEventId: number | null
	resizingEventId: number | null
	dragConflict: boolean

	// Computed
	toDeleteEvent: TTask | null
	selectedEvents: TTask[]
	hasSelectedEvents: boolean
	isDraggingAny: boolean
	isResizingAny: boolean

	// Actions
	openDeleteDialog: () => void
	openCreateDialogPrefilled: (startTime: Time, endTime: Time) => void
	openCreateDialogEmpty: () => void
	openEditDialog: () => void
	toggleEventSelection: (eventId: number) => void
	clearSelection: () => void
	selectEvent: (eventId: number) => void
	deselectEvent: (eventId: number) => void

	updateTaskSpan: (eventId: number, span: TaskSpan) => Promise<void>
}
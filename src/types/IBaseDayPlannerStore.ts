import type {Time} from '@/utils/Time.ts';
import type {IBasePlannerTask} from '@/dtos/response/activityPlanning/IBasePlannerTask.ts';
import type {IBasePlannerTaskRequest} from '@/dtos/request/activityPlanning/IBasePlannerTaskRequest.ts';

export interface IBaseDayPlannerStore<TTask extends IBasePlannerTask, TTaskRequest extends IBasePlannerTaskRequest> {
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
	focusedEventId: number | null
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
	visibleEvents: TTask[]
	toDeleteEvent: TTask | null
	isDraggingAny: boolean
	isResizingAny: boolean

	// Actions
	handleFocusEvent: (eventId: number | null) => void
	openDeleteDialog: () => void
	openCreateDialogPrefilled: (startTime: Time, endTime: Time) => void
	openCreateDialogEmpty: () => void
	openEditDialog: () => void
}
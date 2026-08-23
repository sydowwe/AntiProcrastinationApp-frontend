import type { InjectionKey } from 'vue'
import type { Time } from '@/_common/dto/dto/Time.ts'
import type { AnyPlannerTask, TaskSpan } from '@/core/dayPlanner/dto/response/IBasePlannerTask.ts'
import { type IBasePlannerTask } from '@/core/dayPlanner/dto/response/IBasePlannerTask.ts'
import type { IBasePlannerTaskRequest } from '@/core/dayPlanner/dto/request/IBasePlannerTaskRequest.ts'
import type { CreationPreviewType, PlacingItem, PlannerClipboard } from '@/core/dayPlanner/component/DayPlannerTypes.ts'

/**
 * The surface both planner stores share.
 *
 * It deliberately does NOT extend Pinia's `StoreGeneric`. That brought an implicit `[key: string]:
 * any` along with it, which hid typos, let unrelated fields be read off the base contract, and
 * degraded `$patch` to `_DeepPartial<StateTree>` so every `$patch({ someField: value })` on an
 * injected store failed to compile. Nothing here needs the Pinia instance API: these are setup
 * stores, so every field below is directly writable.
 *
 * Note the task-shaped parameters take `AnyPlannerTask`, not `TTask`. They only ever read the
 * shared surface (`useDayPlannerCommon` touches id / startTime / endTime / isBackground and the
 * three grid fields), and typing them on `TTask` made the whole interface invariant in its task
 * type — which is what stopped a concrete store from being assignable to the injected contract.
 */
export interface IBaseDayPlannerStore<
	TTask extends IBasePlannerTask<TTaskRequest>,
	TTaskRequest extends IBasePlannerTaskRequest,
> {
	// Time/Grid configuration
	timeSlotDuration: number
	viewStartTime: Time
	viewEndTime: Time
	viewedDate?: Date
	isTemplateInPreview?: boolean

	// Time/Grid computed
	timeSlots: Time[]
	totalGridRows: number
	slotIndexToTime: (index: number) => Time
	timeToSlotIndex: (time: Time) => number

	// State
	tasks: TTask[]
	selectedTaskIds: Set<number>
	placingItem: PlacingItem | null
	dialog: boolean
	editedId: number | undefined
	creationPreview: CreationPreviewType | undefined
	deleteDialog: boolean
	draggingTaskId: number | null
	resizingTaskId: number | null
	dragConflict: boolean

	// Computed
	selectedTasks: TTask[]
	showActionBar: boolean
	canCreate: boolean
	isOverMidnight: boolean
	isDraggingAny: boolean
	isResizingAny: boolean

	// Duplicate state
	isDuplicating: boolean

	// Clipboard state (cut / duplicate-to-slot)
	pendingClipboard: PlannerClipboard<TTask> | null
	clipboardPlacementSlot: number | null
	clipboardConflict: boolean
	clipboardPreviewTaskIds: Set<number>
	arrowMoveConflict: boolean

	// Actions
	openDeleteDialog: () => void
	openCreateDialog: () => void
	openEditDialog: () => void
	openDuplicateDialog: () => void
	startCut: () => void
	startDuplicate: () => void
	toggleTaskSelection: (taskId: number) => void
	clearSelection: () => void

	setGridPositionFromSpan: (task: AnyPlannerTask) => void
	checkOverlapsBackground: (task: AnyPlannerTask) => boolean
	updateIsDuringBackgroundFlags: (task: AnyPlannerTask) => void
	checkConflict: (task: AnyPlannerTask, currentEventId?: number) => boolean
	initializeTaskGridPositions: () => void
	redrawTask: (taskId: number, updates: Partial<AnyPlannerTask>) => void

	updateTaskSpan: (taskId: number, span: TaskSpan) => Promise<void>

	resetStore: () => void
}

/**
 * The contract as seen through `provide` / `inject`: the shared surface with the task type widened
 * as far as it goes. Both concrete stores are assignable to it, so a component that only reads the
 * common surface can take this one type instead of carrying three generic parameters of its own.
 */
export type AnyDayPlannerStore = IBaseDayPlannerStore<AnyPlannerTask, IBasePlannerTaskRequest>

/**
 * Typed replacement for the old `inject<TStore>('plannerStore')` string key. Provided by
 * `DayPlannerView` and `TemplateDayPlannerView`; the split view provides one per panel, so never
 * reach for `useTemplateDayPlannerStore()` in a component that can be mounted inside it.
 */
export const PLANNER_STORE_KEY = Symbol('plannerStore') as InjectionKey<AnyDayPlannerStore>

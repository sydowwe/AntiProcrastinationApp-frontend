import { Activity } from '@/core/activity/dto/response/Activity.ts'
import type { IBaseToDoListItem } from '@/core/todoList/dto/response/interface/IBaseToDoListItem.ts'
import { Time } from '@/_common/dto/dto/Time.ts'
import { TaskPriority } from '@/core/todoList/dto/response/TaskPriority.ts'
import { TodoListItemStepEntity } from '@/core/todoList/dto/response/TodoListItemStepEntity.ts'
import { type PlanHelpKind, parsePlanHelpKind } from '@/core/todoList/dto/enum/PlanHelpKind.ts'

/** A planner block's day (`YYYY-MM-DD`, the user's calendar day) and its start on that day. */
export interface PlannedSlot {
	date: string
	startTime: Time
}

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
		/**
		 * Activity id of the paired leisure reward — temptation bundling, see
		 * `composable/useLeisurePairing.ts`. Backend field; until it ships this stays null and the
		 * pairing UI simply shows nothing (`prompts/todo-motivation/backend/N5-backend.md`).
		 */
		public pairedLeisureActivityId: number | null = null,
		/**
		 * The item's next open planner block from the user's today on — when it is *scheduled*.
		 * Distinct from `dueDate`, which is the user's deadline and is never written by the planner.
		 * Read-only: derived by the server from linked planner tasks.
		 */
		public nextPlannedSlot: PlannedSlot | null = null,
		/**
		 * FO3: set when the item keeps slipping in the planner and none of its attempts completed — the
		 * kind of help to offer first. Read-only, derived by the server; null on a done item. Carries no
		 * count by design (see `PlanHelpKind`).
		 */
		public planHelp: PlanHelpKind | null = null,
	) {}

	/** Scheduled means a deadline was set or a block is planned — either answers "when". */
	get isScheduled(): boolean {
		return !!this.dueDate || !!this.nextPlannedSlot
	}

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
			json.pairedLeisureActivityId ?? null,
			json.nextPlannedSlot
				? { date: json.nextPlannedSlot.date, startTime: Time.fromJson(json.nextPlannedSlot.startTime) }
				: null,
			parsePlanHelpKind(json.planHelp),
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

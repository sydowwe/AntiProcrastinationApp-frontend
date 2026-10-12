import { Activity } from '@/core/activity/dto/response/Activity.ts'
import type { IBaseToDoListItem } from '@/core/todoList/dto/response/interface/IBaseToDoListItem.ts'
import { Time } from '@/_common/dto/dto/Time.ts'
import { RoutineTimePeriodEntity } from '@/core/todoList/dto/response/routine/RoutineTimePeriodEntity.ts'
import { TodoListItemStepEntity } from '@/core/todoList/dto/response/TodoListItemStepEntity.ts'
import type { DayOfWeek } from '@/_common/dto/enum/DayOfWeek.ts'

export class RoutineTodoListItemEntity implements IBaseToDoListItem {
	constructor(
		public id: number,
		public activity: Activity,
		public isDone: boolean,
		public doneCount: number | null,
		public totalCount: number | null,
		public timePeriod: RoutineTimePeriodEntity,
		public color: string | null = null,
		public streak: number = 0,
		public bestStreak: number = 0,
		public lastCompletedAt: string | null = null,
		public note: string | null = null,
		public suggestedTime: Time | null = null,
		public suggestedDays: DayOfWeek[] = [],
		public suggestedDayOfMonth: number | null = null,
		public steps: TodoListItemStepEntity[] = [],
		/**
		 * F2-06: how long one occurrence of this item usually takes, from the time logged against it per cycle of
		 * its period. `null` until the server has enough timed occurrences (three). Information only — it never
		 * replaces `suggestedTime`, which also decides when the tracker completes the item.
		 */
		public typicalSeconds: number | null = null,
		/** The occurrences behind `typicalSeconds`; `null` whenever that is. */
		public sampleCount: number | null = null,
	) {}

	get isMultipleCount() {
		return !!this.totalCount && this.totalCount !== 1
	}

	/** `typicalSeconds` as a `Time`. Under a minute reads as nothing, the way the chip's `getNice` would render it. */
	get typicalTime(): Time | null {
		if (!this.typicalSeconds) return null
		const time = Time.fromSeconds(this.typicalSeconds)
		return time.isNotZero() ? time : null
	}

	static fromJson(json: any) {
		const timePeriod = RoutineTimePeriodEntity.fromJson(json.routineTimePeriod)
		return new RoutineTodoListItemEntity(
			json.id,
			Activity.fromJson(json.activity),
			json.isDone,
			json.doneCount,
			json.totalCount,
			timePeriod,
			// The server sends no per-item colour; the row's accent bar takes its period's, the colour the
			// period's timeline and stats already wear. A period with none parses to '' and gets no bar.
			timePeriod.color || null,
			json.streak ?? 0,
			json.bestStreak ?? 0,
			json.lastCompletedAt ?? null,
			json.note ?? null,
			json.suggestedTime ? Time.fromJson(json.suggestedTime) : null,
			json.suggestedDays ?? [],
			json.suggestedDayOfMonth ?? null,
			TodoListItemStepEntity.listFromObjects(json.steps ?? []),
			json.typicalSeconds ?? null,
			json.sampleCount ?? null,
		)
	}

	static listFromObjects(objects: any[]) {
		return objects.map((item: object) => this.fromJson(item))
	}
}

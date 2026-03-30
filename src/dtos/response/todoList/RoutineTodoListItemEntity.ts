import { Activity } from '@/dtos/response/activity/Activity.ts'
import { TimePeriodEntity } from '../activityRecording/TimePeriodEntity.ts'
import type { IBaseToDoListItem } from '@/dtos/response/interface/IBaseToDoListItem.ts'
export class RoutineTodoListItemEntity implements IBaseToDoListItem {
	constructor(
		public id: number,
		public activity: Activity,
		public isDone: boolean,
		public doneCount: number | null,
		public totalCount: number | null,
		public timePeriod: TimePeriodEntity,
		public color: string | null = null,
		public streak: number = 0,
		public bestStreak: number = 0,
		public lastCompletedAt: string | null = null,
		public note: string | null = null,
	) {}

	get isMultipleCount() {
		return !!this.totalCount && this.totalCount !== 1
	}

	static fromJson(json: any) {
		return new RoutineTodoListItemEntity(
			json.id,
			Activity.fromJson(json.activity),
			json.isDone,
			json.doneCount,
			json.totalCount,
			TimePeriodEntity.fromJson(json.routineTimePeriod),
			null,
			json.streak ?? 0,
			json.bestStreak ?? 0,
			json.lastCompletedAt ?? null,
			json.note ?? null,
		)
	}

	static listFromObjects(objects: any[]) {
		return objects.map((item: object) => this.fromJson(item))
	}
}

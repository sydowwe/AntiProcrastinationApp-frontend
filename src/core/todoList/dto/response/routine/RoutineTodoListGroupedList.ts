import { RoutineTodoListItemEntity } from './RoutineTodoListItemEntity.ts'
import { RoutineTimePeriodEntity } from './RoutineTimePeriodEntity.ts'

export class RoutineTodoListGroupedList {
	constructor(
		public timePeriod: RoutineTimePeriodEntity,
		public items: RoutineTodoListItemEntity[],
	) {}

	static fromJson(json: any) {
		return new RoutineTodoListGroupedList(
			RoutineTimePeriodEntity.fromJson(json.routineTimePeriod),
			RoutineTodoListItemEntity.listFromObjects(json.items),
		)
	}

	static listFromObjects(objects: any[]) {
		return objects.map((item: object) => this.fromJson(item))
	}
}

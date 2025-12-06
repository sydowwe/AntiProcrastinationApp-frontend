import {RoutineTodoListItemEntity} from './RoutineTodoListItemEntity';
import {TimePeriodEntity} from './TimePeriodEntity';

export class RoutineTodoListGroupedList {
	constructor(
		public timePeriod: TimePeriodEntity,
		public items: RoutineTodoListItemEntity[]) {
	}

	static fromJson(json: any) {
		return new RoutineTodoListGroupedList(json.routineTimePeriod, RoutineTodoListItemEntity.listFromObjects(json.items));
	}

	static listFromObjects(objects: any[]) {
		return objects.map((item: object) => this.fromJson(item));
	}
}

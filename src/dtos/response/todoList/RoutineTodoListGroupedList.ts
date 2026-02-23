import {RoutineTodoListItemEntity} from './RoutineTodoListItemEntity.ts';
import {TimePeriodEntity} from '../activityRecording/TimePeriodEntity.ts';

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

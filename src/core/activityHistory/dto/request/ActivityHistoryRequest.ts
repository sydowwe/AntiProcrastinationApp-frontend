import type { Time } from '@/_common/dto/dto/Time.ts'
import { TimePrecise } from '@/_common/dto/dto/TimePrecise.ts'

export class ActivityHistoryRequest {
	constructor(
		public startTimestamp: Date,
		public length: Time,
		public activityId: number,
		/**
		 * The to-do item the time was logged from. The daily recap credits an item with exactly the rows that
		 * carry its id, so a log that drops it shows the item as taking no time. Never set with the routine one.
		 */
		public todoListItemId: number | null = null,
		/** Same, for a routine item. */
		public routineTodoListId: number | null = null,
	) {}

	static fromJson(object: any) {
		const {
			startTimestamp = new Date(),
			length = new TimePrecise(),
			activityId = 0,
			todoListItemId = null,
			routineTodoListId = null,
		} = object
		return new ActivityHistoryRequest(startTimestamp, length, activityId, todoListItemId, routineTodoListId)
	}

	static listFromObjects(objects: any[]) {
		return objects.map((item: object) => this.fromJson(item))
	}
}

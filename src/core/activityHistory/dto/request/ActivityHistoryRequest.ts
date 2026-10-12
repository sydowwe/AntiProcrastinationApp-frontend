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
		/**
		 * This log is one sitting of the linked item, logged from the item itself, so the server ticks the item
		 * once: one repetition of a counted item, done for a plain one (FO2). Needs a link; the API refuses it alone.
		 * Leave it false where the link is only recap credit, as home's planner-block timer does.
		 */
		public countsAsRepetition = false,
	) {}

	static fromJson(object: any) {
		const {
			startTimestamp = new Date(),
			length = new TimePrecise(),
			activityId = 0,
			todoListItemId = null,
			routineTodoListId = null,
			countsAsRepetition = false,
		} = object
		return new ActivityHistoryRequest(
			startTimestamp,
			length,
			activityId,
			todoListItemId,
			routineTodoListId,
			countsAsRepetition,
		)
	}

	static listFromObjects(objects: any[]) {
		return objects.map((item: object) => this.fromJson(item))
	}
}

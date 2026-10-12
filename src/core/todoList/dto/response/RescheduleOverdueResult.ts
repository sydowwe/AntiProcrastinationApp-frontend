/** `POST todo-list-item/reschedule-overdue`'s answer: the new due date, and exactly which items took it. */
export class RescheduleOverdueResult {
	constructor(
		/** `YYYY-MM-DD`, the user's today plus the days asked for — resolved on the server, in the user's zone. */
		public dueDate: string,
		/**
		 * The server's set, not the list the client last fetched: an item another tab already moved is not in
		 * it, so an undo restores these and nothing else.
		 */
		public movedIds: number[],
		/**
		 * Takes the move back on the server, postponements included, for 15 minutes
		 * (`POST todo-list-item/reschedule-overdue/undo`). Null when nothing moved, or from an API that predates it.
		 */
		public undoToken: string | null = null,
	) {}

	static fromJson(json: any) {
		const { dueDate, movedIds = [], undoToken = null } = json
		return new RescheduleOverdueResult(dueDate, movedIds, undoToken)
	}

	static listFromObjects(objects: any[]) {
		return objects.map(object => RescheduleOverdueResult.fromJson(object))
	}
}

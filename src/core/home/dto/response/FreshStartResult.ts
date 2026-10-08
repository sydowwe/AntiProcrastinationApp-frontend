/** `POST welcome-back/fresh-start` (FO5): what changed, and the token that takes it back for fifteen minutes. */
export class FreshStartResult {
	constructor(
		public readonly undoToken: string,
		public readonly rescheduledTodoIds: number[],
		public readonly closedTaskIds: number[],
		public readonly carriedTaskIds: number[],
		public readonly notificationsMarkedRead: number,
	) {}

	/** Whether the fresh start changed anything at all — "keep" on every row changes nothing. */
	get changedAnything(): boolean {
		return (
			this.rescheduledTodoIds.length > 0 ||
			this.closedTaskIds.length > 0 ||
			this.carriedTaskIds.length > 0 ||
			this.notificationsMarkedRead > 0
		)
	}

	static fromJson(json: any): FreshStartResult {
		const {
			undoToken = '',
			rescheduledTodoIds = [],
			closedTaskIds = [],
			carriedTaskIds = [],
			notificationsMarkedRead = 0,
		} = json ?? {}
		return new FreshStartResult(
			undoToken,
			rescheduledTodoIds,
			closedTaskIds,
			carriedTaskIds,
			notificationsMarkedRead,
		)
	}
}

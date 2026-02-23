export class BaseToDoListItemRequest {
	constructor(
		public isDone: boolean,
		public activityId?: number,
		public doneCount: number | null = null,
		public totalCount: number | null = null,
	) {
	}
}

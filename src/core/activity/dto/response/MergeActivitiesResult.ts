/**
 * What a merge actually did, as counted by the server.
 *
 * The dialog predicts these two numbers from the `usageCount`s it has on screen and says them out
 * loud before the user confirms; the response is what the success snackbar reports, because the
 * prediction is from a table that may be minutes old.
 */
export class MergeActivitiesResult {
	constructor(
		public survivorId: number = 0,
		/** How many activities were deleted — the length of the request's `mergedIds`. */
		public mergedCount: number = 0,
		/** How many rows, across every referencing entity type, now point at the survivor instead. */
		public repointedCount: number = 0,
	) {}

	static fromJson(object: any) {
		const { survivorId = 0, mergedCount = 0, repointedCount = 0 } = object ?? {}
		return new MergeActivitiesResult(survivorId, mergedCount, repointedCount)
	}

	static listFromObjects(objects: any[]) {
		return objects.map((item: object) => this.fromJson(item))
	}
}

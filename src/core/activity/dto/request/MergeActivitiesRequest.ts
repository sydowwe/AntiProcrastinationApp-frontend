/**
 * Fold `mergedIds` into `survivorId`: every reference to a merged-away activity repoints to the
 * survivor and the merged-away rows are deleted. Irreversible — the confirmation in
 * `MergeActivitiesDialog.vue` is the only safeguard, because nothing retains the pre-merge mapping.
 */
export class MergeActivitiesRequest {
	constructor(
		public survivorId: number = 0,
		/** Never contains `survivorId`; the dialog strips it before sending. */
		public mergedIds: number[] = [],
	) {}

	static fromJson(object: any) {
		const { survivorId = 0, mergedIds = [] } = object
		return new MergeActivitiesRequest(survivorId, mergedIds)
	}
}

export type EstimateFitGroupBy = 'list' | 'category' | 'priority'

/**
 * One group's figures (F3-01). The server leaves out any group with fewer than five completed items, so an
 * instance here is always one the user may be shown.
 */
export class EstimateFitGroup {
	constructor(
		/** List, category or priority id, per the request's `groupBy`. `null`: no list, or an uncategorised one. */
		public key: number | null,
		/** Median of logged time ÷ estimate. 1.5 means about one and a half times the estimate. */
		public loggedRatio: number,
		public sampleCount: number,
		/** Median of first planned block ÷ estimate; `null` while fewer than five of the items were ever planned. */
		public plannedRatio: number | null,
		public plannedSampleCount: number,
	) {}

	static fromJson(json: any) {
		const { key = null, loggedRatio, sampleCount = 0, plannedRatio = null, plannedSampleCount = 0 } = json
		return new EstimateFitGroup(key, loggedRatio, sampleCount, plannedRatio, plannedSampleCount)
	}

	static listFromObjects(objects: any[]) {
		return objects.map(object => EstimateFitGroup.fromJson(object))
	}
}

export class EstimateFit {
	constructor(
		public groups: EstimateFitGroup[],
		/** Seconds logged against each timed item across all days, open items included. */
		public loggedSecondsByItemId: Map<number, number>,
	) {}

	static fromJson(json: any) {
		const { groups = [], items = [] } = json
		return new EstimateFit(
			EstimateFitGroup.listFromObjects(groups),
			new Map(items.map((item: any) => [item.itemId, item.loggedSeconds])),
		)
	}
}

/**
 * The longest run of attention on a single item in the span.
 *
 * `seconds` is wall-clock from the run's first start to its last end, tolerated interruptions
 * included — it is not the sum of the sessions inside it.
 *
 * `label` is the display name the same item carries on `summary-cards`: the domain, the product name
 * or the app label depending on the source. On desktop the server groups by process name and labels
 * with product name, so two helper processes of one suite stay separate items here even though they
 * may share a label.
 */
export class FocusBlock {
	constructor(
		public label: string,
		public startedAt: Date,
		public endedAt: Date,
		public seconds: number,
	) {}

	static fromJson(json: any): FocusBlock {
		const { label = '', startedAt, endedAt, seconds = 0 } = json ?? {}
		return new FocusBlock(label, new Date(startedAt), new Date(endedAt), seconds)
	}
}

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
		return new FocusBlock(label, toInstant(startedAt), toInstant(endedAt), seconds)
	}
}

/**
 * A missing time becomes an Invalid Date, which the strip leaves out. Not `new Date(raw)` alone:
 * `new Date(null)` is the epoch, a valid date that would print as a real 1970 time.
 */
function toInstant(raw: unknown): Date {
	return raw == null ? new Date(Number.NaN) : new Date(raw as string)
}

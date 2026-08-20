export class HistorySummaryCard {
	constructor(
		/** Null on the synthetic `Uncategorized` bucket only — see `HistoryGroupKey.ts`. */
		public groupId: number | null,
		public name: string,
		/**
		 * B2: null on **every** row of an activity-grouped response (activities carry no colour) and on
		 * `Uncategorized`. Resolve through `resolveHistoryGroupColor`, never render this raw.
		 */
		public color: string | null,
		public totalSeconds: number,
		/**
		 * B2: **not** the selected period's daily average — the backend assigns this the *baseline*
		 * period's daily average, the same number `percentChange` is computed against. Reported to the
		 * backend as a bug; until it is fixed, label it as a baseline or derive the current-period
		 * average from `totalSeconds` and the range's day count instead.
		 */
		public averageSeconds: number,
		/** B2: genuinely nullable — null when `isNew`, or when the baseline daily average is 0. */
		public percentChange: number | null,
		public isNew: boolean,
	) {}

	static fromJson(json: any): HistorySummaryCard {
		return new HistorySummaryCard(
			json.groupId ?? null,
			json.name,
			json.color ?? null,
			json.totalSeconds,
			json.averageSeconds,
			json.percentChange ?? null,
			json.isNew,
		)
	}
}

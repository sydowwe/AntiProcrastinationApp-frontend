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
		 * The baseline's mean day scaled to the selected period's length — what `totalSeconds` usually is,
		 * and the number `percentChange` is computed against (OP14). It used to be the bare daily mean (B2),
		 * which sat beside a period total on every multi-day range. 0 when the baseline found nothing.
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
			json.averageSeconds ?? 0,
			json.percentChange ?? null,
			json.isNew,
		)
	}
}

import { ActivityStat } from '@/core/activityTracking/dto/response/topDomains/ActivityStat.ts'
import { type ActivitySource, parseActivitySources } from '@/core/activityTracking/dto/enum/ActivitySource.ts'

/**
 * A summary card's worth of one merged item. Structurally `SummaryCardsData` with `domain` renamed to
 * `label` and `sources` added — see `UnifiedActivityItem` for why the unified contract carries one
 * identity string rather than the identifier/display-name pair the per-source contracts use.
 *
 * `active` / `background` keep their meaning and their nullability: `null` is "no activity of this
 * kind", which is what android contributes to `background` for every item it is alone on.
 */
export class UnifiedSummaryItem {
	constructor(
		public label: string,
		public active: ActivityStat | null,
		public background: ActivityStat | null,
		public totalSeconds: number,
		public isNew: boolean,
		public sources: ActivitySource[],
	) {}

	static fromJson(json: any): UnifiedSummaryItem {
		const {
			label = '',
			active = null,
			background = null,
			totalSeconds = 0,
			isNew = false,
			sources = [],
		} = json ?? {}
		return new UnifiedSummaryItem(
			label,
			active ? ActivityStat.fromJson(active) : null,
			background ? ActivityStat.fromJson(background) : null,
			totalSeconds,
			isNew,
			parseActivitySources(sources),
		)
	}

	static listFromObjects(objects: any[]): UnifiedSummaryItem[] {
		return (objects ?? []).map(object => UnifiedSummaryItem.fromJson(object))
	}
}

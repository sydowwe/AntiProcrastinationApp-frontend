import { UnifiedWindowItem } from '@/core/activityTracking/dto/response/unified/UnifiedWindowItem.ts'

/**
 * The same window shape the three per-source `stacked-bars` endpoints return, with merged items. The
 * tiling rule is `U3-backend.md` §3 verbatim — windows tile each day's time-of-day window below 1440
 * minutes and the span itself above it — because the chart that renders them is the same one and it
 * generates its own empty slots on that alignment.
 */
export class UnifiedStackedBarsWindow {
	constructor(
		public windowStart: Date,
		public windowEnd: Date,
		public items: UnifiedWindowItem[],
	) {}

	static fromJson(json: any): UnifiedStackedBarsWindow {
		const { windowStart, windowEnd, items = [] } = json ?? {}
		return new UnifiedStackedBarsWindow(
			new Date(windowStart),
			new Date(windowEnd),
			(items ?? []).map((item: any) => UnifiedWindowItem.fromJson(item)),
		)
	}

	static listFromObjects(objects: any[]): UnifiedStackedBarsWindow[] {
		return (objects ?? []).map(object => UnifiedStackedBarsWindow.fromJson(object))
	}
}

import { type ActivitySource, parseActivitySources } from '@/core/activityTracking/dto/enum/ActivitySource.ts'

/**
 * One bar segment inside a stacked-bars window, merged across sources.
 *
 * Merged by `label`, deliberately: a per-`(label, source)` split would draw the same application twice
 * in one column, in the same colour, and the stacked bars have no room to say why. The source
 * dimension is carried by the timeline's lanes and by the source filter's own totals, which is where
 * it can be read.
 */
export class UnifiedWindowItem {
	constructor(
		public label: string,
		public activeSeconds: number,
		public backgroundSeconds: number,
		public sources: ActivitySource[],
	) {}

	static fromJson(json: any): UnifiedWindowItem {
		const { label = '', activeSeconds = 0, backgroundSeconds = 0, sources = [] } = json ?? {}
		return new UnifiedWindowItem(label, activeSeconds, backgroundSeconds, parseActivitySources(sources))
	}
}

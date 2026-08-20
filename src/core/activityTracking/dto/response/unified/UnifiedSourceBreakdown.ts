import { ActivitySource, parseActivitySource } from '@/core/activityTracking/dto/enum/ActivitySource.ts'

/**
 * What one tracker contributed to the merged span, and what the overlap rule took away from it.
 *
 * This is the panel that makes the resolution visible. Without it a merged total is unfalsifiable: a
 * user who sees less time than the two per-source dashboards add up to has no way to tell whether
 * their Chrome hour was attributed to the extension, halved, or dropped. `displacedSeconds` and
 * `displacedTo` say exactly which, in the source's own row.
 */
export class UnifiedSourceBreakdown {
	constructor(
		public source: ActivitySource,
		/**
		 * Whether the source recorded anything at all in the span, *before* de-overlapping. A source
		 * with `hasData: false` is one that is not connected or was not used, and the filter greys it
		 * out — distinct from a source whose every second was displaced, which is a real finding.
		 */
		public hasData: boolean,
		/**
		 * Seconds attributed to this source after the overlap rule. These sum **exactly** to the pie
		 * chart's `totals.totalSeconds`, and `countedSeconds + displacedSeconds` is exactly this
		 * source's own dashboard total for the same span — the server reads every figure off one
		 * ledger rounded once with largest-remainder rather than rounding each item.
		 *
		 * So do not re-round, re-derive or "correct" these client-side: any per-item arithmetic here
		 * reintroduces the drift the single rounding pass exists to avoid, and it shows up on exactly
		 * the busy days a user would check the sum by hand.
		 */
		public countedSeconds: number,
		/** Seconds this source recorded that a higher-precedence source was credited with instead. */
		public displacedSeconds: number,
		/** Which source took them. `null` when `displacedSeconds` is 0. */
		public displacedTo: ActivitySource | null,
	) {}

	static fromJson(json: any): UnifiedSourceBreakdown {
		const { source, hasData = false, countedSeconds = 0, displacedSeconds = 0, displacedTo = null } = json ?? {}
		return new UnifiedSourceBreakdown(
			parseActivitySource(source) ?? ActivitySource.WebExtension,
			hasData,
			countedSeconds,
			displacedSeconds,
			parseActivitySource(displacedTo),
		)
	}

	static listFromObjects(objects: any[]): UnifiedSourceBreakdown[] {
		return (objects ?? []).map(object => UnifiedSourceBreakdown.fromJson(object))
	}
}

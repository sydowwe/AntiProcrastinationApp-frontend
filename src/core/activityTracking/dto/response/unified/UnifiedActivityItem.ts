import { type ActivitySource, parseActivitySources } from '@/core/activityTracking/dto/enum/ActivitySource.ts'

/**
 * One merged thing the user spent time on, across every selected source.
 *
 * ON `label`, AND WHY THERE IS NO SEPARATE KEY. The three per-source contracts carry two strings per
 * item — an identifier (`domain` / `processName` / `packageName`) and a display name (`domain` /
 * `productName` / `appLabel`) — and the dashboards feed the *identifier* to `getDomainColor()` while
 * showing the *display name*. Merged, that is a bug: `Slack` the desktop process and `Slack` the phone
 * app hash from `slack.exe` and `com.Slack`, so one application arrives on screen in two colours with
 * one name.
 *
 * The unified contract collapses the pair. `label` is the single identity string — it is what is
 * displayed, what selection is keyed on, and what colour is derived from, everywhere in this view.
 * The join is the server's: the same application must arrive under the same `label` whichever source
 * saw it. Where the server cannot join two sources' items they keep different labels and therefore
 * different colours, which is the honest outcome rather than a failure — the alternative is inventing
 * an identity the data does not support.
 */
export class UnifiedActivityItem {
	constructor(
		public label: string,
		public activeSeconds: number,
		public backgroundSeconds: number,
		public totalSeconds: number,
		/** Which trackers contributed, after de-overlapping. Never empty for a returned item. */
		public sources: ActivitySource[],
		public entries: number,
	) {}

	static fromJson(json: any): UnifiedActivityItem {
		const {
			label = '',
			activeSeconds = 0,
			backgroundSeconds = 0,
			totalSeconds = 0,
			sources = [],
			entries = 0,
		} = json ?? {}
		return new UnifiedActivityItem(
			label,
			activeSeconds,
			backgroundSeconds,
			totalSeconds,
			parseActivitySources(sources),
			entries,
		)
	}

	static listFromObjects(objects: any[]): UnifiedActivityItem[] {
		return (objects ?? []).map(object => UnifiedActivityItem.fromJson(object))
	}
}

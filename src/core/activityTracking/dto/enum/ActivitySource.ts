/**
 * The three trackers that feed this module. The per-source dashboards never needed to name them —
 * each one *is* a source and the route carried the fact. The unified view is the first place three
 * sources appear on one screen, so they need identities.
 *
 * The wire values are what `sources` carries in every unified request and what every unified response
 * echoes back; they are not display strings. Labels live in `useActivitySources()`.
 */
export enum ActivitySource {
	WebExtension = 'webExtension',
	Desktop = 'desktop',
	Android = 'android',
}

/**
 * PRECEDENCE, most specific first. This is the order the server resolves overlaps in, and the order
 * the client renders sources in — the two must agree, because the UI explains the resolution and an
 * explanation that lists sources in a different order than it applied them is worse than none.
 *
 * Why this order, and why it is only half the rule:
 *
 * - **Web extension over desktop.** They overlap constantly and predictably: an hour in Chrome is
 *   logged by the desktop agent as `chrome.exe` and by the extension as a set of domains. Keeping the
 *   process and dropping the domains discards the only information the overlap contains, so the more
 *   specific claim wins.
 * - **Desktop over android.** These are different machines and rarely overlap, so this is a tie-break
 *   rather than a judgement about which tracker is right.
 *
 * The rank alone is not enough, which is the part easy to miss: a desktop *background* claim must not
 * beat an android *foreground* one just because desktop outranks android. The full rule the contract
 * states is two-level — **active beats background first, rank decides within an activity class** —
 * so a browser left open on a second monitor does not swallow the time you spent on your phone.
 * Android reports no background time at all, so all of its time is in the active class.
 *
 * @see prompts/activity-tracking/backend/U4-backend.md §2
 */
export const ACTIVITY_SOURCE_ORDER: readonly ActivitySource[] = [
	ActivitySource.WebExtension,
	ActivitySource.Desktop,
	ActivitySource.Android,
]

const SOURCE_VALUES = new Set<string>(ACTIVITY_SOURCE_ORDER)

/** Narrows an unknown (a URL param, a JSON field) to a source, or `null` if it names none. */
export function parseActivitySource(value: unknown): ActivitySource | null {
	return typeof value === 'string' && SOURCE_VALUES.has(value) ? (value as ActivitySource) : null
}

/**
 * Parses a list of sources, dropping anything unrecognised and any duplicate, and returns them in
 * `ACTIVITY_SOURCE_ORDER` — so a hand-edited `?sources=android,desktop` and a click-built selection
 * produce the same request body and therefore hit the same cache entry.
 */
export function parseActivitySources(values: unknown): ActivitySource[] {
	const list = Array.isArray(values) ? values : []
	const found = new Set<ActivitySource>()
	for (const value of list) {
		const source = parseActivitySource(value)
		if (source !== null) {
			found.add(source)
		}
	}
	return ACTIVITY_SOURCE_ORDER.filter(source => found.has(source))
}

/**
 * The sentinel a folded "tail" row carries — the rows below the threshold, rolled into one. It is both
 * the client's own roll-up key and, since backend `B16`, the one the server emits on all eight tracking
 * endpoints (`FoldedRow.Sentinel`); the four pie endpoints used to send a literal `"Other"` here.
 *
 * It is a sentinel, not a name: it is translated on the way out (`activityTracking.common.other`),
 * coloured neutrally, and never selectable. Branch on it rather than on a display string.
 */
export const OTHER_DOMAIN = '_other'

export class PieSegment {
	constructor(
		public domain: string,
		public seconds: number,
		public percent: number,
		public color: string,
	) {}
}

/**
 * The one fold threshold for every tracking pie. The dashboards request no `minPercent`, so the server
 * sends every row and this is the only place a tail is rolled up — which is also what lets the user
 * expand it (`foldPieTail` with `thresholdPercent: 0`). It used to be 1 % server-side and 3 % again
 * client-side on two of the four sections.
 */
export const PIE_TAIL_THRESHOLD_PERCENT = 3

export interface FoldedPie {
	segments: PieSegment[]
	/** How many real rows went into the `OTHER_DOMAIN` segment — 0 when nothing is folded. */
	foldedCount: number
}

/**
 * Sorts `data` by seconds and rolls every row under `thresholdPercent` of the total into one
 * `OTHER_DOMAIN` segment. `keep` (the current selection) is never folded, so a `?selected=` item still
 * has a slice to highlight. A lone sub-threshold row stays itself — an "Other" of one hides a name for
 * nothing. A server-sent `OTHER_DOMAIN` row (a caller that still passes `minPercent`) always joins the
 * fold, so the legend never carries two.
 */
export function foldPieTail(
	data: Omit<PieSegment, 'percent'>[],
	otherColor: string,
	{
		thresholdPercent = PIE_TAIL_THRESHOLD_PERCENT,
		keep = null,
	}: { thresholdPercent?: number; keep?: string | null } = {},
): FoldedPie {
	const rows = data.filter(d => d.seconds > 0)
	const total = rows.reduce((sum, d) => sum + d.seconds, 0)
	if (total === 0) return { segments: [], foldedCount: 0 }

	const withPercent = rows.map(d => ({ ...d, percent: (d.seconds / total) * 100 }))
	function isTail(d: PieSegment) {
		return d.domain === OTHER_DOMAIN || (d.domain !== keep && d.percent < thresholdPercent)
	}

	const tail = withPercent.filter(isTail)
	const foldedCount = tail.filter(d => d.domain !== OTHER_DOMAIN).length
	const foldsNothing = tail.length === 0 || (tail.length === 1 && foldedCount === 1)
	if (foldsNothing) {
		return { segments: withPercent.sort((a, b) => b.seconds - a.seconds), foldedCount: 0 }
	}

	const otherSeconds = tail.reduce((sum, d) => sum + d.seconds, 0)
	const segments = withPercent.filter(d => !isTail(d))
	segments.push({
		domain: OTHER_DOMAIN,
		seconds: otherSeconds,
		percent: (otherSeconds / total) * 100,
		color: otherColor,
	})

	return { segments: segments.sort((a, b) => b.seconds - a.seconds), foldedCount }
}

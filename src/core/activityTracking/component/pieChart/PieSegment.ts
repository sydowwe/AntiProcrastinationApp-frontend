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

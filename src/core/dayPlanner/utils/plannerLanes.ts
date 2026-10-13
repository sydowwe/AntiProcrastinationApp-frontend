/**
 * Side-by-side lanes for overlapping planner blocks (the "planner lanes" step after FO6).
 *
 * Up to two foreground blocks may share a minute, and separately up to two background blocks. The day
 * grid draws a two-lane stretch as two half-width blocks (two narrow strips for background), so both
 * stay visible and the user can decide which one to keep. A third is refused by every grid gesture and
 * by the task dialog, and the server refuses it too (409 `Conflict`) on its three single-task writes, but
 * not on the bulk paths (copy-to-days, template apply, the materialiser), so one can still arrive. The
 * renderer then keeps it on screen, on top of lane 1 and marked as a clash, rather than hiding it.
 *
 * Everything here is pure and works on one linear axis of minutes, so the day grid (minutes from the
 * view start, see `useDayPlannerCommon`), home (minutes of the day) and the mini timeline can all use
 * it. The caller unwraps midnight before it gets here.
 */

/** How many blocks of one kind may overlap at any minute. */
export const MAX_LANES = 2

export interface LaneSpan {
	id: number
	/** Minutes on the caller's axis. A span with `end <= start` overlaps nothing and is drawn full width. */
	start: number
	end: number
	isBackground: boolean
}

export interface TaskLane {
	/** 0 or 1. A clash sits in the last lane, on top of the block already there. */
	lane: number
	/** How many lanes the block's overlap group uses: 1 draws it full width, 2 half width. */
	laneCount: number
	/** A third block at some minute of its span, which no lane is left for. */
	clash: boolean
	/**
	 * Foreground only: how many background strips the block has to clear on its left, 0, 1 or 2. It is
	 * the widest background group it overlaps, so a block beside two side-by-side strips clears both.
	 */
	backgroundLanes: number
	/** Ids of the blocks of the same kind it shares a minute with, in time order. */
	overlapsWith: number[]
	/** Its index in time order across both kinds, which is the order keyboard focus should follow. */
	order: number
}

function hasLength(span: LaneSpan): boolean {
	return span.end > span.start
}

export function spansOverlap(a: LaneSpan, b: LaneSpan): boolean {
	return hasLength(a) && hasLength(b) && a.start < b.end && a.end > b.start
}

/** Start first, then the longer block first so it takes lane 0, then id so a re-sort never flickers. */
function byTime(a: LaneSpan, b: LaneSpan): number {
	return a.start - b.start || b.end - a.end || a.id - b.id
}

/**
 * Gives every span a lane. Blocks that overlap nothing keep the full width; an overlap group (blocks
 * linked by overlaps, transitively) uses two lanes, and every block in it is drawn half width, which
 * keeps a block from changing width halfway down. First fit in start order needs a third lane exactly
 * where three blocks share a minute, so `clash` agrees with `exceedsLaneLimit`.
 */
export function assignLanes(spans: readonly LaneSpan[]): Map<number, TaskLane> {
	const sorted = [...spans].sort(byTime)
	const lanes = new Map<number, TaskLane>()
	sorted.forEach((span, order) =>
		lanes.set(span.id, { lane: 0, laneCount: 1, clash: false, backgroundLanes: 0, overlapsWith: [], order }),
	)

	const foreground = sorted.filter(span => !span.isBackground)
	const background = sorted.filter(span => span.isBackground)
	assignKind(foreground, lanes)
	assignKind(background, lanes)

	for (const span of foreground) {
		let backgroundLanes = 0
		for (const strip of background) {
			if (spansOverlap(span, strip)) backgroundLanes = Math.max(backgroundLanes, lanes.get(strip.id)!.laneCount)
		}
		lanes.get(span.id)!.backgroundLanes = backgroundLanes
	}
	return lanes
}

function assignKind(kind: LaneSpan[], lanes: Map<number, TaskLane>): void {
	let group: LaneSpan[] = []
	let groupEnd = -Infinity
	let laneEnds: number[] = []
	let lanesUsed = 1

	function closeGroup() {
		for (const span of group) lanes.get(span.id)!.laneCount = lanesUsed
	}

	for (const span of kind) {
		if (!hasLength(span)) continue
		if (span.start >= groupEnd) {
			closeGroup()
			group = []
			laneEnds = []
			lanesUsed = 1
		}
		group.push(span)
		groupEnd = Math.max(groupEnd, span.end)

		const info = lanes.get(span.id)!
		info.overlapsWith = kind.filter(other => other.id !== span.id && spansOverlap(span, other)).map(o => o.id)

		let lane = 0
		while (lane < MAX_LANES && (laneEnds[lane] ?? -Infinity) > span.start) lane++
		if (lane < MAX_LANES) {
			laneEnds[lane] = span.end
			info.lane = lane
		} else {
			// Not given a lane end: the clash is drawn over lane 1, and must not push later blocks into
			// clashing with it as well.
			info.lane = MAX_LANES - 1
			info.clash = true
		}
		lanesUsed = Math.max(lanesUsed, info.lane + 1)
	}
	closeGroup()
}

/**
 * Whether the day, with every span already at its new place, has more than `MAX_LANES` blocks of one
 * kind at some minute of a moved span. Only minutes the move covers count: a clash that arrived from
 * elsewhere does not stop the user from moving an unrelated block.
 */
export function exceedsLaneLimit(spans: readonly LaneSpan[], movedIds: ReadonlySet<number>): boolean {
	return spans.some(span => movedIds.has(span.id) && maxDepthWithin(span, spans) > MAX_LANES)
}

/** The most blocks of `span`'s kind, itself included, that share any one minute of it. */
function maxDepthWithin(span: LaneSpan, spans: readonly LaneSpan[]): number {
	if (!hasLength(span)) return 0
	const events: Array<[minute: number, delta: number]> = []
	for (const other of spans) {
		if (other === span || other.isBackground !== span.isBackground || !spansOverlap(span, other)) continue
		events.push([Math.max(other.start, span.start), 1], [Math.min(other.end, span.end), -1])
	}
	// An end and a start on the same minute do not overlap, so ends go first.
	events.sort((a, b) => a[0] - b[0] || a[1] - b[1])
	let depth = 0
	let max = 0
	for (const [, delta] of events) {
		depth += delta
		max = Math.max(max, depth)
	}
	return max + 1
}

// --- Layout on the day grid -------------------------------------------------------------------------

/** A background strip alone. */
export const BACKGROUND_STRIP_PX = 36
/**
 * Each of two background strips side by side. Narrower than one alone so a foreground block beside
 * them keeps room at 360 px, still wide enough for the strip's sideways label.
 */
export const NARROW_BACKGROUND_STRIP_PX = 28

function backgroundStripPx(laneCount: number): number {
	return laneCount > 1 ? NARROW_BACKGROUND_STRIP_PX : BACKGROUND_STRIP_PX
}

/** Where a background strip sits: from the column's left edge, one strip per lane. */
export function backgroundLaneStyle(lane: TaskLane | undefined): { left: string; width: string } {
	const width = backgroundStripPx(lane?.laneCount ?? 1)
	return { left: `${(lane?.lane ?? 0) * width}px`, width: `${width}px` }
}

/** The gap between two foreground blocks side by side. */
const LANE_GAP_PX = 2

/** Where a foreground block sits: past the background strips beside it, then the whole width or one half. */
export function foregroundLaneStyle(lane: TaskLane | undefined): { left: string; right: string } {
	const backgroundLanes = lane?.backgroundLanes ?? 0
	const inset = backgroundLanes === 0 ? 0 : backgroundLanes * backgroundStripPx(backgroundLanes)
	if (!lane || lane.laneCount < 2) return { left: `${inset}px`, right: '0px' }
	const half = `(100% - ${inset}px) / 2`
	return lane.lane === 0
		? { left: `${inset}px`, right: `calc(${half} + ${LANE_GAP_PX / 2}px)` }
		: { left: `calc(${inset}px + ${half} + ${LANE_GAP_PX / 2}px)`, right: '0px' }
}

/** The blocks of `span`'s kind it shares a minute with, in time order — what the dialog names. */
export function collisionsOf(span: LaneSpan, spans: readonly LaneSpan[]): LaneSpan[] {
	return spans
		.filter(other => other !== span && other.isBackground === span.isBackground && spansOverlap(span, other))
		.sort(byTime)
}

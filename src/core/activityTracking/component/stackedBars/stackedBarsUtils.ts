/**
 * The window sizes offered when the dashboard is on a single day. Unchanged from before range mode
 * existed, and deliberately not derived from the budget below: single day is the default and by far
 * the most-used view, and the budget would drop 15m and 20m from a 07:00-00:00 window (68 and 51
 * columns) that has been readable in practice for as long as the chart has shipped.
 */
export const SINGLE_DAY_WINDOW_SIZES = [15, 20, 30, 60, 90, 120]

/**
 * Sub-daily candidates tile the *daily* window on each day of the range; whole-day candidates tile
 * the range itself. Nothing between the two exists on purpose — a 20-hour window would straddle day
 * boundaries and slice the daily window differently on every day, which is neither readable nor
 * expressible in the request contract.
 */
const SUB_DAILY_CANDIDATES = [30, 60, 120, 240, 480]
const WHOLE_DAY_CANDIDATES = [1440, 4320, 10080]

/** Below this the chart says nothing a summary card doesn't; above it the columns stop being legible. */
const MIN_COLUMNS = 3
const MAX_COLUMNS = 48

/** How many columns a given window size produces over `dayCount` days of a `dailyWindowMinutes` window. */
export function estimateColumnCount(windowMinutes: number, dayCount: number, dailyWindowMinutes: number): number {
	if (windowMinutes >= 1440) {
		return Math.ceil(dayCount / (windowMinutes / 1440))
	}
	return Math.ceil(dailyWindowMinutes / windowMinutes) * dayCount
}

/**
 * The window sizes worth offering for a range, finest first — so `[0]` is both the default and the
 * most detailed readable option. A single day keeps its historical ladder; anything longer is chosen
 * by column budget, which is what actually makes the chart readable or not.
 *
 * `dailyWindowMinutes` is the length of the *time-of-day* window (07:00-00:00 → 1020), not the range.
 */
export function windowSizeOptionsForSpan(dayCount: number, dailyWindowMinutes: number): number[] {
	if (dayCount <= 1) {
		return SINGLE_DAY_WINDOW_SIZES
	}

	const candidates = [...SUB_DAILY_CANDIDATES.filter(mins => mins <= dailyWindowMinutes), ...WHOLE_DAY_CANDIDATES]
	const fitting = candidates.filter(mins => {
		const columns = estimateColumnCount(mins, dayCount, dailyWindowMinutes)
		return columns >= MIN_COLUMNS && columns <= MAX_COLUMNS
	})

	// A range long enough that even a one-week window overflows the budget (roughly a year) still
	// needs something selectable — give it the coarsest option rather than an empty select.
	return fitting.length > 0 ? fitting : [WHOLE_DAY_CANDIDATES[WHOLE_DAY_CANDIDATES.length - 1]!]
}

export function getRowUnit(windowMinutes: number): number {
	if (windowMinutes <= 90) return 1
	if (windowMinutes <= 360) return 5
	if (windowMinutes <= 1440) return 15
	if (windowMinutes <= 10080) return 60
	return 480
}

export function getYAxisInterval(displayMinutes: number): number {
	if (displayMinutes <= 15) return 5
	if (displayMinutes <= 20) return 5
	if (displayMinutes <= 30) return 5
	if (displayMinutes <= 60) return 10
	if (displayMinutes <= 180) return 15
	if (displayMinutes <= 300) return 20
	if (displayMinutes <= 480) return 30
	if (displayMinutes <= 960) return 60
	if (displayMinutes <= 1440) return 120
	if (displayMinutes <= 10080) return 1440
	return 4320
}

export function formatYAxisLabel(minutes: number): string {
	if (minutes < 60) return `${minutes}m`
	if (minutes < 1440) {
		const h = Math.floor(minutes / 60)
		const m = minutes % 60
		return m === 0 ? `${h}h` : `${h}h ${m}m`
	}
	if (minutes < 10080) return `${minutes / 1440}d`
	return `${minutes / 10080}w`
}

export function formatWindowMinutes(mins: number): string {
	if (mins >= 10080) return `${mins / 10080}w`
	if (mins >= 1440) return `${mins / 1440}d`
	if (mins >= 60) return `${mins / 60}h`
	return `${mins}m`
}

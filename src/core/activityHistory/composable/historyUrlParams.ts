import { Time } from '@/_common/dto/dto/Time.ts'

/**
 * Pure parse/serialize helpers for the URL query params shared by HistorySummaryView and
 * HistoryDetailView (H6). Kept out of useHistoryDashboard.ts because they know nothing about
 * fetching or the dashboard's reactive state — just the route <-> typed-value mapping.
 */

const DEFAULT_WINDOW_SIZE_FALLBACK = 240

export function serializeWindowSize(minutes: number): string {
	const t = Time.fromMinutes(minutes)
	if (t.hours === 0) return `${t.minutes}m`
	if (t.minutes === 0) return `${t.hours}h`
	return `${t.hours}h${t.minutes}m`
}

/** Inverse of serializeWindowSize, e.g. "2h30m" -> 150. */
export function parseWindowSize(val: unknown, fallback: number = DEFAULT_WINDOW_SIZE_FALLBACK): number {
	if (typeof val !== 'string') return fallback
	const match = val.match(/^(?:(\d+)h)?(?:(\d+)m)?$/)
	if (!match) return fallback
	const total = parseInt(match[1] ?? '0') * 60 + parseInt(match[2] ?? '0')
	return total > 0 ? total : fallback
}

/** Accepts the raw query value only if it is one of `allowed`, otherwise falls back. */
export function parseEnumParam<T extends string>(val: unknown, allowed: readonly T[], fallback: T): T {
	return typeof val === 'string' && (allowed as readonly string[]).includes(val) ? (val as T) : fallback
}

export function parseTimeParam(val: unknown, fallback: Time): Time {
	return typeof val === 'string' && val !== '' ? Time.fromString(val) : fallback
}

export function parseTopN(val: unknown, fallback: number): number {
	if (typeof val !== 'string') return fallback
	const n = parseInt(val, 10)
	return Number.isFinite(n) && n > 0 ? n : fallback
}

/** The half of the query string both dashboard views carry; each adds its own range params around it. */
export interface SharedHistoryQueryState {
	groupBy: string
	windowSize: number
	timeFrom: Time
	timeTo: Time
	baseline: string
	topN: number
}

export function sharedHistoryQueryParams(state: SharedHistoryQueryState): Record<string, string> {
	return {
		groupBy: state.groupBy,
		windowSize: serializeWindowSize(state.windowSize),
		timeFrom: state.timeFrom.getString(),
		timeTo: state.timeTo.getString(),
		baseline: state.baseline,
		topN: String(state.topN),
	}
}

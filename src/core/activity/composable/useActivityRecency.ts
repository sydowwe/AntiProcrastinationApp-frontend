import type { SelectOption } from '@/_common/dto/response/general/SelectOption.ts'
import { readUserScoped, userScopedKey, writeUserScoped } from '@/core/user/composable/useUserScopedStorage.ts'

/**
 * Which activities were picked most recently, so the picker can float them to the top.
 *
 * Device-local on purpose. Recency is a UI preference, not domain data: it costs an endpoint and a
 * migration to hold server-side and buys nothing on a single-user-per-device app. It also has to
 * survive being wrong — an absent, corrupted or fully-pruned entry leaves the list in the server's
 * alphabetical order, which is exactly the behaviour that existed before this file.
 *
 * Shape: `{ [bucket]: activityId[] }`, most recent first, capped per bucket. `all` is the unscoped
 * bucket and `r<roleId>` is the per-role one — "the last thing I did at work" and "the last thing I
 * did at home" are different questions, so a picker with a role selected reads only that role's
 * bucket. A selection writes both, so switching a role filter on or off never starts from nothing.
 *
 * The storage name carries a version: a shape change bumps it and the old key is simply ignored,
 * because there is nothing here worth migrating.
 */
const STORAGE_NAME = 'activityPickerRecency.v1'
const MAX_PER_BUCKET = 10
const UNSCOPED_BUCKET = 'all'

type RecencyBuckets = Record<string, number[]>

// Parsed once per account rather than per keystroke — `orderActivityOptionsByRecency` runs on every
// change to the form. Keyed by the user-scoped storage key so signing in as someone else in the same
// tab re-reads instead of serving the previous account's list.
let cache: { key: string; buckets: RecencyBuckets } | null = null

function bucketFor(roleId: number | null): string {
	return roleId == null ? UNSCOPED_BUCKET : `r${roleId}`
}

/** Anything that is not a bounded list of integer ids is discarded rather than trusted. */
function sanitize(parsed: unknown): RecencyBuckets {
	if (parsed == null || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
	const buckets: RecencyBuckets = {}
	for (const [bucket, ids] of Object.entries(parsed as Record<string, unknown>)) {
		if (!Array.isArray(ids)) continue
		const clean = ids.filter((id): id is number => typeof id === 'number' && Number.isInteger(id))
		if (clean.length > 0) buckets[bucket] = clean.slice(0, MAX_PER_BUCKET)
	}
	return buckets
}

function readBuckets(): RecencyBuckets {
	const key = userScopedKey(STORAGE_NAME)
	if (cache?.key === key) return cache.buckets
	let buckets: RecencyBuckets = {}
	const raw = readUserScoped(STORAGE_NAME)
	if (raw !== null) {
		try {
			buckets = sanitize(JSON.parse(raw))
		} catch {
			// Corrupted entry: fall back to alphabetical and let the next selection rewrite it.
			buckets = {}
		}
	}
	cache = { key, buckets }
	return buckets
}

function persist(buckets: RecencyBuckets) {
	cache = { key: userScopedKey(STORAGE_NAME), buckets }
	writeUserScoped(STORAGE_NAME, JSON.stringify(buckets))
}

/**
 * Record a committed selection. Called when the user picks an activity or creates one inline — not
 * while they type, because an autocomplete search term is not a choice.
 */
export function recordActivitySelection(activityId: number, roleId: number | null) {
	const buckets = { ...readBuckets() }
	const targets = roleId == null ? [UNSCOPED_BUCKET] : [UNSCOPED_BUCKET, bucketFor(roleId)]
	for (const bucket of targets) {
		buckets[bucket] = [activityId, ...(buckets[bucket] ?? []).filter(id => id !== activityId)].slice(
			0,
			MAX_PER_BUCKET,
		)
	}
	persist(buckets)
}

/**
 * Drop ids that no longer exist. Only ever called with the full activity list: the per-source
 * combination matrices are narrower than the whole taxonomy, and pruning against one of those would
 * throw away perfectly good ids for every other picker.
 */
export function pruneRecencyToKnownActivities(knownActivityIds: Iterable<number>) {
	const known = new Set(knownActivityIds)
	const buckets = readBuckets()
	const next: RecencyBuckets = {}
	let changed = false
	for (const [bucket, ids] of Object.entries(buckets)) {
		const kept = ids.filter(id => known.has(id))
		if (kept.length !== ids.length) changed = true
		if (kept.length > 0) next[bucket] = kept
	}
	if (!changed) return
	persist(next)
}

/**
 * The options with the recently-picked ones first, in recency order, and the rest left in whatever
 * order they arrived in — alphabetical, from the server.
 *
 * `recentCount` is how many of the leading options came from the recency list, which is what the
 * picker needs to draw the group heading. A recent id that is not among `options` (filtered out by
 * the role or category narrowing, or belonging to another source) is skipped, so the count is always
 * the number actually rendered.
 */
export function orderActivityOptionsByRecency(
	options: SelectOption[],
	roleId: number | null,
): { options: SelectOption[]; recentCount: number } {
	const recentIds = readBuckets()[bucketFor(roleId)] ?? []
	if (recentIds.length === 0 || options.length === 0) return { options, recentCount: 0 }

	const remaining = new Map(options.map(option => [option.id, option]))
	const recent: SelectOption[] = []
	for (const id of recentIds) {
		const option = remaining.get(id)
		if (!option) continue
		recent.push(option)
		remaining.delete(id)
	}
	if (recent.length === 0) return { options, recentCount: 0 }
	return { options: [...recent, ...remaining.values()], recentCount: recent.length }
}

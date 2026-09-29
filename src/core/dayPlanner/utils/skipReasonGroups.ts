import { BUILT_IN_SKIP_REASONS, type BuiltInSkipReason } from '@/core/dayPlanner/dto/enum/BuiltInSkipReason.ts'

/**
 * How skip reasons are grouped for counting. The reason is free text (B26), so "the same reason" has
 * to be decided somewhere, and it is decided here, once, for every surface that counts them — the
 * day's line (one entry per task) and the calendar's range line (one entry per server group).
 *
 * 1. **A key is a key.** The app's own three reasons are stored as `skipReasonKey` (B1), and the
 *    server converts the six exact labels to the key on write and in old rows. A key group is
 *    displayed in the current locale, because it is the app's words, not the user's.
 * 2. **Blank is no reason.** Trimmed, and empty becomes null — the server's own rule, applied again
 *    here because the day planner writes the raw textarea value into its store before any refetch.
 * 3. **Exact match after normalising is the floor, and the ceiling for user text.** NFC (so a
 *    composed and a decomposed "ň" are one letter), whitespace runs collapsed, then case-folded.
 *    "Tired" and "tired " are one reason. "tired" and "too tired" are two, and stay two: a fuzzy
 *    merge that is wrong puts words in the user's mouth, and a split that is wrong only costs a count.
 *    The server does no folding (B1 rule 4), so its "Tired" and "tired" groups merge here.
 * 4. **Text that folds onto a built-in label joins that key's group.** The server only converts
 *    *exact* labels, so "ran out of time" comes back as text beside a `noTime` key group, and is the
 *    same answer. Matched against the exact labels in `planner.skipReason.*` in every loaded locale
 *    (after rule 3) — never by similarity. Everything else is displayed as the user wrote it (first
 *    spelling seen).
 * 5. **Null is its own group, not missing data.** Skipping without saying why is a complete answer.
 *    It is counted, so totals add up, but it never competes as a "reason".
 */

export type SkipReasonGroup =
	| { kind: 'builtIn'; reason: BuiltInSkipReason; count: number }
	| { kind: 'text'; text: string; count: number }

/** One skip (`count` 1) or one already-counted server group. Both fields null means no reason. */
export interface SkipReasonEntry {
	reason: string | null
	reasonKey: BuiltInSkipReason | null
	count: number
}

export interface SkipReasonSummary {
	total: number
	/** Named reasons, most frequent first; ties keep the order they were first seen in. */
	groups: SkipReasonGroup[]
	withoutReasonCount: number
}

/** Folded form → built-in key. Build with `buildBuiltInLookup`. */
export type BuiltInLookup = ReadonlyMap<string, BuiltInSkipReason>

export function normaliseSkipReason(raw: string | null | undefined): string | null {
	const trimmed = raw?.normalize('NFC').replace(/\s+/g, ' ').trim() ?? ''
	return trimmed === '' ? null : trimmed
}

function fold(normalised: string): string {
	return normalised.toLowerCase()
}

/**
 * @param labelsByLocale one entry per loaded locale, mapping each built-in key to its label there.
 *   A missing label is skipped rather than guessed.
 */
export function buildBuiltInLookup(labelsByLocale: Partial<Record<BuiltInSkipReason, unknown>>[]): BuiltInLookup {
	const lookup = new Map<string, BuiltInSkipReason>()
	for (const labels of labelsByLocale) {
		for (const key of BUILT_IN_SKIP_REASONS) {
			const label = labels[key]
			if (typeof label !== 'string') continue
			const normalised = normaliseSkipReason(label)
			if (normalised !== null) lookup.set(fold(normalised), key)
		}
	}
	return lookup
}

type Classified = { id: string; group: SkipReasonGroup } | null

/** Which group an entry belongs to (rules 1–4), or null for no reason (rule 5). */
function classify({ reason, reasonKey, count }: SkipReasonEntry, builtIns: BuiltInLookup): Classified {
	if (reasonKey !== null) return { id: `builtIn:${reasonKey}`, group: { kind: 'builtIn', reason: reasonKey, count } }
	const text = normaliseSkipReason(reason)
	if (text === null) return null
	const folded = fold(text)
	const builtIn = builtIns.get(folded)
	return builtIn === undefined
		? { id: `text:${folded}`, group: { kind: 'text', text, count } }
		: { id: `builtIn:${builtIn}`, group: { kind: 'builtIn', reason: builtIn, count } }
}

export function groupSkipReasons(entries: SkipReasonEntry[], builtIns: BuiltInLookup): SkipReasonSummary {
	const groups = new Map<string, SkipReasonGroup>()
	let total = 0
	let withoutReasonCount = 0

	for (const entry of entries) {
		total += entry.count
		const classified = classify(entry, builtIns)
		if (classified === null) {
			withoutReasonCount += entry.count
			continue
		}
		const existing = groups.get(classified.id)
		if (existing) existing.count += entry.count
		else groups.set(classified.id, classified.group)
	}

	return {
		total,
		// Array#sort is stable, so equal counts keep their first-seen order.
		groups: [...groups.values()].sort((a, b) => b.count - a.count),
		withoutReasonCount,
	}
}

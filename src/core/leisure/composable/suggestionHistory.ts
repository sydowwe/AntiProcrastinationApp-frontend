import type { EffortType } from '@/core/leisure/dto/enum/EffortType.ts'
import { readUserScoped, writeUserScoped } from '@/core/user/composable/useUserScopedStorage.ts'

/**
 * What the picker remembers between draws: which candidates it has already put in front of the user,
 * and the effort type of the last one they actually committed to.
 *
 * **This is `localStorage`, not a Pinia store.** The app's stores persist to `sessionStorage`, which
 * is exactly the wrong lifetime here — "don't show me the same three things again" has to survive
 * closing the tab or it never fires. It is also, deliberately, not reactive: the draw reads it once
 * and then *writes* to it, and a reactive read would make that write invalidate the draw it came
 * from.
 *
 * **Known limitation, and the reason `backend/D1-backend.md` exists**: this is per-device. Rerolling
 * on a phone does not stop the laptop offering the same three. Moving the record server-side is the
 * headline ask in that file; nothing else in the module has to change when it lands, because
 * `RankingContext.lastSuggestedAt` is where it enters the rule either way.
 *
 * P4 found this key un-namespaced and scoped it by account. That does not make it cross-device — it
 * stops two accounts on one browser from suppressing each other's suggestions, which was the more
 * embarrassing half of the same bug. The server ask stays where it already is (`D1`); P4's own ask
 * deliberately does not repeat it.
 */

const STORAGE_KEY = 'leisure.picker.history'
/** Past this, "last suggested" has stopped meaning anything and is only making the blob bigger. */
const RETENTION_DAYS = 90

export interface SuggestionHistory {
	/** Candidate key → ISO instant it was last shown. */
	suggestedAt: Record<string, string>
	lastCommittedEffort: EffortType | null
}

function emptyHistory(): SuggestionHistory {
	return { suggestedAt: {}, lastCommittedEffort: null }
}

function prune(suggestedAt: Record<string, string>, now: Date): Record<string, string> {
	const cutoff = now.getTime() - RETENTION_DAYS * 86_400_000
	const kept: Record<string, string> = {}
	for (const [key, iso] of Object.entries(suggestedAt)) {
		const at = new Date(iso).getTime()
		if (Number.isFinite(at) && at >= cutoff) {
			kept[key] = iso
		}
	}
	return kept
}

/** Storage can be unavailable (private mode, disabled cookies) or hold something else's key. */
export function readSuggestionHistory(now: Date = new Date()): SuggestionHistory {
	try {
		const raw = readUserScoped(STORAGE_KEY)
		if (raw === null) return emptyHistory()
		const parsed: unknown = JSON.parse(raw)
		if (parsed === null || typeof parsed !== 'object') return emptyHistory()
		const { suggestedAt, lastCommittedEffort } = parsed as Partial<SuggestionHistory>
		return {
			suggestedAt: prune(suggestedAt !== null && typeof suggestedAt === 'object' ? suggestedAt : {}, now),
			lastCommittedEffort: lastCommittedEffort ?? null,
		}
	} catch {
		return emptyHistory()
	}
}

function writeSuggestionHistory(history: SuggestionHistory): void {
	try {
		writeUserScoped(STORAGE_KEY, JSON.stringify(history))
	} catch {
		// A full or unavailable quota costs the user variety, not the feature — stay quiet.
	}
}

/**
 * Mark candidates as seen.
 *
 * Called when a draw is *rejected* (the user pressed "something else") and when one is committed to —
 * not when a draw is merely rendered. Recording on render would mean reloading the page demoted the
 * very cards on it, and the seeded URL would stop reproducing its own draw.
 */
export function recordSuggested(keys: readonly string[], now: Date = new Date()): void {
	if (keys.length === 0) return
	const history = readSuggestionHistory(now)
	const iso = now.toISOString()
	for (const key of keys) {
		history.suggestedAt[key] = iso
	}
	writeSuggestionHistory(history)
}

/** The user picked this one. Its effort type is what the next draw varies away from. */
export function recordCommitted(key: string, effortType: EffortType | null, now: Date = new Date()): void {
	const history = readSuggestionHistory(now)
	history.suggestedAt[key] = now.toISOString()
	history.lastCommittedEffort = effortType
	writeSuggestionHistory(history)
}

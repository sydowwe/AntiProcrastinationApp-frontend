import { API } from '@/_common/axiosConfig.ts'
import { LeisureDraw } from '@/core/leisure/dto/response/LeisureSuggestion.ts'
import type { EnergyLevel } from '@/core/leisure/dto/enum/EnergyLevel.ts'

export interface LeisureDrawRequest {
	minutes: number
	energy: EnergyLevel
	people: number
	maxCostTierId: number | null
	locationTypeId: number | null
	/** uint32, from the page URL. Same body + same data + same history ⇒ the same cards. */
	seed: number
	count: number
}

/** `rejected` for the whole outgoing set on "something else"; `committed` for the one the user planned. */
export type LeisureSuggestionOutcome = 'rejected' | 'committed'

/**
 * The leisure picker's server side (F2-04). The draw ranks all three profile tables in SQL plus
 * `LeisureDrawRanker`, with today's weather; `seen` is its memory, shared across devices — rerolling on a
 * phone now moves the laptop's next draw too.
 */
export function useLeisureSuggestionApi() {
	/** Throws on failure — the interceptor shows it, and the picker flags the failed load. */
	async function draw(request: LeisureDrawRequest, signal?: AbortSignal): Promise<LeisureDraw> {
		const { data } = await API.post('/leisure-suggestion', request, { signal })
		return LeisureDraw.fromJson(data)
	}

	/**
	 * Never on render — only on a reroll or a commit, or a reload would demote the very cards on screen and a
	 * `?seed=` link would stop reproducing its draw. `_silent` and never rejecting: a lost record costs the next
	 * draw some variety, which is not worth an error over a reroll or a plan that already worked.
	 */
	async function recordSeen(keys: readonly string[], outcome: LeisureSuggestionOutcome): Promise<void> {
		if (keys.length === 0) return
		try {
			await API.post('/leisure-suggestion/seen', { keys, outcome }, { _silent: true })
		} catch {
			// Deliberately quiet — see above.
		}
	}

	return { draw, recordSeen }
}

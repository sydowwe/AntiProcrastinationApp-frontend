import { ref } from 'vue'
import { isoDateInUserZone } from '@/_common/composable/general/useUserClock.ts'
import { fetchDailyRecap } from '@/core/todoList/api/todoListItemApi.ts'
import type { DailyRecap } from '@/core/todoList/dto/response/DailyRecap.ts'

/**
 * End-of-day recap (Amabile & Kramer's progress principle — see prompts/todo-motivation/N4-daily-recap.md).
 * Module-scoped like useEstimateCalibration/useLeisurePairing: the list view's recap card and the home
 * dashboard's waiting rewards read one copy, and share one request per day instead of one each.
 *
 * Nothing is pushed: a completion made anywhere shows up only on the next read, which is what
 * `refresh()` is for.
 */
const recap = ref<DailyRecap | null>(null)
let loadedForDate: string | null = null
let inFlightFor: string | null = null
let loadPromise: Promise<boolean> | null = null
// Latest-wins: a slow read must not land over a newer one, and a read that belongs to the previous
// account must not land at all after `reset()`.
let requestSeq = 0

function load(date: string): Promise<boolean> {
	const seq = ++requestSeq
	inFlightFor = date
	loadPromise = fetchDailyRecap(date).then(result => {
		if (seq !== requestSeq) return false
		inFlightFor = null
		// A failed read is not cached: the day's next caller retries instead of living with nothing.
		if (result === null) return false
		recap.value = result
		loadedForDate = date
		return true
	})
	return loadPromise
}

export function useDailyRecap() {
	function ensureLoadedForToday(): Promise<void> {
		// "What day is it now" is an instant read, so it resolves in the user's zone — the server
		// bounds the recap's day in the same zone (B2), and this is both the request parameter and
		// the once-per-day cache key.
		const today = isoDateInUserZone()
		if ((loadedForDate === today || inFlightFor === today) && loadPromise) return loadPromise.then(() => {})
		return load(today).then(() => {})
	}

	/** Re-reads today's recap regardless of the cache. Resolves `true` only when this read is the one that landed. */
	function refresh(): Promise<boolean> {
		return load(isoDateInUserZone())
	}

	/** Forget everything, including any read still in flight — for an account switch. */
	function reset() {
		requestSeq++
		recap.value = null
		loadedForDate = null
		inFlightFor = null
		loadPromise = null
	}

	return { recap, ensureLoadedForToday, refresh, reset }
}

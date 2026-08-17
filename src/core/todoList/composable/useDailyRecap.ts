import { ref } from 'vue'
import { isoDateInUserZone } from '@/_common/composable/general/useUserClock.ts'
import { fetchDailyRecap } from '@/core/todoList/api/todoListItemApi.ts'
import type { DailyRecap } from '@/core/todoList/dto/response/DailyRecap.ts'

/**
 * End-of-day recap (Amabile & Kramer's progress principle — see prompts/todo-motivation/N4-daily-recap.md).
 * Module-scoped like useEstimateCalibration/useLeisurePairing: several mounts (todo list view, home widget)
 * share one request per day instead of one each.
 */
const recap = ref<DailyRecap | null>(null)
let loadedForDate: string | null = null
let loadPromise: Promise<void> | null = null

export function useDailyRecap() {
	function ensureLoadedForToday(): Promise<void> {
		// "What day is it now" is an instant read, so it resolves in the user's zone — the server
		// resolves the recap's day boundary in the same zone, and this is both the request parameter
		// and the once-per-day cache key.
		const today = isoDateInUserZone()
		if (loadedForDate === today) return loadPromise ?? Promise.resolve()
		loadPromise = fetchDailyRecap(today).then(result => {
			recap.value = result
			loadedForDate = today
		})
		return loadPromise
	}

	return { recap, ensureLoadedForToday }
}

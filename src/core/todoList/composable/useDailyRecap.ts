import { ref } from 'vue'
import { formatDateForApi } from '@/_common/utils/DateTimeHelper.ts'
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
		const today = formatDateForApi(new Date())
		if (loadedForDate === today) return loadPromise ?? Promise.resolve()
		loadPromise = fetchDailyRecap(new Date()).then(result => {
			recap.value = result
			loadedForDate = today
		})
		return loadPromise
	}

	return { recap, ensureLoadedForToday }
}

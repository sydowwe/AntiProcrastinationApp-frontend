import { ref } from 'vue'
import { defineStore } from 'pinia'

/**
 * Tracks which calendar week (per the user's firstDayOfWeek preference) the fresh-start weekly
 * review was last dismissed for. Local-only and persisted to localStorage (not the app default
 * sessionStorage) so the dismissal survives closing the browser — otherwise the card would
 * reappear on every new tab within the same week.
 */
export const useRoutineReviewStore = defineStore(
	'routineReview',
	() => {
		const lastDismissedWeekStart = ref<string | null>(null)

		function dismissForWeek(weekStartIso: string) {
			lastDismissedWeekStart.value = weekStartIso
		}

		return { lastDismissedWeekStart, dismissForWeek }
	},
	{ persist: { storage: localStorage } },
)

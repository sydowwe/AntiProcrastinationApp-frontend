import { ref } from 'vue'
import { defineStore } from 'pinia'
import { migrateLegacyKey, userScopedKey } from '@/core/user/composable/useUserScopedStorage.ts'

/**
 * Tracks which calendar week (per the user's firstDayOfWeek preference) the fresh-start weekly
 * review was last dismissed for. Local-only and persisted to localStorage (not the app default
 * sessionStorage) so the dismissal survives closing the browser — otherwise the card would
 * reappear on every new tab within the same week.
 *
 * P4 triage: this is a real per-user decision, not a device fact — dismissing on the laptop and
 * seeing the card again on the desktop is the user-visible consequence — so it is in the batched
 * ask, `prompts/user/backend/B5-account-scoped-state.md`. Until that lands it is at least scoped by
 * account, so two people sharing a browser do not dismiss each other's review.
 * TODO(B5): move the dismissal to the server.
 */
const STORE_KEY = 'routineReview'
export const useRoutineReviewStore = defineStore(
	'routineReview',
	() => {
		const lastDismissedWeekStart = ref<string | null>(null)

		function dismissForWeek(weekStartIso: string) {
			lastDismissedWeekStart.value = weekStartIso
		}

		return { lastDismissedWeekStart, dismissForWeek }
	},
	{
		persist: {
			storage: localStorage,
			// A function, so the account is read when the store is first created — after the auth guard
			// has run — rather than when this module is imported.
			key: () => {
				migrateLegacyKey(STORE_KEY)
				return userScopedKey(STORE_KEY)
			},
		},
	},
)

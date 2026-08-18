import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useUserStore } from '@/_common/modules/user/store/authStore.ts'
import { readUserScoped, writeUserScoped } from '@/core/user/composable/useUserScopedStorage.ts'

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
 *
 * Deliberately NOT using Pinia's declarative `persist: { key: () => ... }` (as this store did until
 * A1): that key function only runs once, when the store is first created, and a Pinia store is a
 * singleton for the tab's lifetime. Sign out and sign in as someone else in the same tab, and every
 * write after that would still land on the FIRST account's storage key — silently overwriting their
 * dismissal with the second account's, not just misreading it. Reading and writing through
 * `readUserScoped`/`writeUserScoped` instead re-resolves the key on every call, which is what
 * `useUserScopedStorage.ts` and every other consumer of it already do.
 */
const STORE_KEY = 'routineReview'
export const useRoutineReviewStore = defineStore('routineReview', () => {
	const lastDismissedWeekStart = ref<string | null>(readUserScoped(STORE_KEY))

	function dismissForWeek(weekStartIso: string) {
		lastDismissedWeekStart.value = weekStartIso
		writeUserScoped(STORE_KEY, weekStartIso)
	}

	function resetStore() {
		lastDismissedWeekStart.value = null
	}

	// Covers sign-in, not just sign-out: `resetStore` (called on logout, see `useSessionReset.ts`)
	// leaves this at `null` until someone is signed in again, and the next account's dismissal — or
	// lack of one — has to be re-read from ITS key, not inherited from whoever was signed in when
	// this store was first created.
	watch(
		() => useUserStore().currentUser.id,
		() => {
			lastDismissedWeekStart.value = readUserScoped(STORE_KEY)
		},
	)

	return { lastDismissedWeekStart, dismissForWeek, resetStore }
})

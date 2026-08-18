import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useUserStore } from '@/_common/modules/user/store/authStore.ts'
import { useRoutineSettingsApi } from '@/core/todoList/api/routineSettingsApi.ts'
import { UserRoutineSettingsRequest } from '@/core/todoList/dto/request/UserRoutineSettingsRequest.ts'

/**
 * Which calendar week (per the user's firstDayOfWeek preference) the fresh-start weekly review was
 * last dismissed for.
 *
 * B5 answered: this now lives on the server, at `GET`/`PUT routine/settings`, because "I have
 * already dealt with this week" is a fact about the person and the week, not about a browser —
 * dismissing on the laptop used to leave the card waiting on the desktop and again on the phone.
 * The dismissal is still for the WEEK rather than "until the routines change"; if that rule ever
 * changes, the value stops being a date and the contract changes with it.
 *
 * The week comparison stays entirely client-side (`useRoutineWeeklyReview.ts`) — the client is the
 * only side that knows which week the user is currently looking at.
 *
 * Not persisted: the server is the source of truth and `ensureLoaded` runs on every visit to the
 * routine view. Persisting would only reintroduce the stale per-device copy this replaced.
 */
export const useRoutineReviewStore = defineStore(
	'routineReview',
	() => {
		const { fetchSettings, updateSettings } = useRoutineSettingsApi()

		const lastDismissedWeekStart = ref<string | null>(null)
		const isLoaded = ref(false)
		let inFlight: Promise<void> | null = null

		/** Idempotent and de-duplicated: several mounts in one visit share the single GET. */
		async function ensureLoaded(): Promise<void> {
			if (isLoaded.value) return
			inFlight ??= fetchSettings()
				.then(settings => {
					lastDismissedWeekStart.value = settings.routineReviewDismissedForWeekStart
					isLoaded.value = true
				})
				.finally(() => {
					inFlight = null
				})
			await inFlight
		}

		async function dismissForWeek(weekStartIso: string): Promise<void> {
			const previous = lastDismissedWeekStart.value
			// Optimistic: the card must disappear on the click, not a round trip later.
			lastDismissedWeekStart.value = weekStartIso
			try {
				await updateSettings(new UserRoutineSettingsRequest(weekStartIso))
			} catch {
				lastDismissedWeekStart.value = previous
			}
		}

		function resetStore() {
			lastDismissedWeekStart.value = null
			isLoaded.value = false
			inFlight = null
		}

		// Covers sign-in, not just sign-out. A Pinia store is a singleton for the tab's lifetime, so
		// signing in as someone else in the same tab would otherwise keep the first account's
		// dismissal — and, worse, keep `isLoaded` true so it is never re-read.
		watch(
			() => useUserStore().currentUser.id,
			() => resetStore(),
		)

		return { lastDismissedWeekStart, isLoaded, ensureLoaded, dismissForWeek, resetStore }
	},
	{ persist: false },
)

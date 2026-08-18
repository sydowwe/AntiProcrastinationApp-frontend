import { computed } from 'vue'
import { useUserPreferences } from '@/core/user/composable/useUserPreferences.ts'
import { useRoutineReviewStore } from '@/core/todoList/store/routineReviewStore.ts'
import { formatDateForApi, getWeekStart } from '@/_common/utils/DateTimeHelper.ts'
import { isoDateInUserZone } from '@/_common/composable/general/useUserClock.ts'

/**
 * Fresh-start effect (Dai, Milkman & Riis 2014, Management Science): aspirational behaviour
 * spikes at temporal landmarks like the start of a week. Anchors the weekly routine review to the
 * user's own firstDayOfWeek preference rather than assuming Monday, via DateTimeHelper's
 * getWeekStart (the non-ISO counterpart added for F5).
 */
export function useRoutineWeeklyReview() {
	const { firstDayOfWeek } = useUserPreferences()
	const reviewStore = useRoutineReviewStore()

	const weekStartIso = computed(() => {
		// "Which day is today" is an instant read, so it resolves in the user's zone; the local-midnight
		// `Date` built from it is a calendar day (class 2), whose browser-local fields round-trip through
		// `getWeekStart`/`formatDateForApi` below. Walking back to the first day of the week is
		// class-3 date arithmetic and is zone-independent.
		const [year, month, day0] = isoDateInUserZone().split('-').map(Number)
		const today = new Date(year!, month! - 1, day0!)
		return formatDateForApi(getWeekStart(today, firstDayOfWeek.value))
	})

	// False until the dismissal has been read from the server (B5), so a user who already dismissed
	// this week never sees the card flash in before the answer arrives.
	const isNewWeek = computed(() => reviewStore.isLoaded && reviewStore.lastDismissedWeekStart !== weekStartIso.value)

	async function dismissForThisWeek() {
		await reviewStore.dismissForWeek(weekStartIso.value)
	}

	return { weekStartIso, isNewWeek, ensureLoaded: reviewStore.ensureLoaded, dismissForThisWeek }
}

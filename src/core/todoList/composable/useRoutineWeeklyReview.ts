import { computed } from 'vue'
import { useUserStore } from '@/_common/modules/user/store/authStore.ts'
import { useRoutineReviewStore } from '@/core/todoList/store/routineReviewStore.ts'
import { formatDateForApi } from '@/_common/utils/DateTimeHelper.ts'
import { isoDateInUserZone } from '@/_common/composable/general/useUserClock.ts'

/**
 * Fresh-start effect (Dai, Milkman & Riis 2014, Management Science): aspirational behaviour
 * spikes at temporal landmarks like the start of a week. Anchors the weekly routine review to the
 * user's own firstDayOfWeek preference rather than assuming Monday — DateTimeHelper's
 * getISOWeekStart is fixed to Monday, so the boundary is computed locally here instead.
 */
export function useRoutineWeeklyReview() {
	const userStore = useUserStore()
	const reviewStore = useRoutineReviewStore()

	const weekStartIso = computed(() => {
		const firstDayOfWeek = userStore.currentUser.firstDayOfWeek ?? 1
		// "Which day is today" is an instant read, so it resolves in the user's zone; the local-midnight
		// `Date` built from it is a calendar day (class 2), whose browser-local fields round-trip through
		// `getDay`/`setDate`/`formatDateForApi` below. Walking back to the first day of the week is
		// class-3 date arithmetic and is zone-independent.
		const [year, month, day0] = isoDateInUserZone().split('-').map(Number)
		const weekStart = new Date(year!, month! - 1, day0!)
		const day = weekStart.getDay() // 0 = Sunday .. 6 = Saturday
		const diff = (day - firstDayOfWeek + 7) % 7
		weekStart.setDate(weekStart.getDate() - diff)
		return formatDateForApi(weekStart)
	})

	const isNewWeek = computed(() => reviewStore.lastDismissedWeekStart !== weekStartIso.value)

	function dismissForThisWeek() {
		reviewStore.dismissForWeek(weekStartIso.value)
	}

	return { weekStartIso, isNewWeek, dismissForThisWeek }
}

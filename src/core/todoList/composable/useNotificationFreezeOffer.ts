import { useRoute, useRouter } from 'vue-router'
import { useStreakFreeze } from '@/core/todoList/composable/useStreakFreeze.ts'
import type { RoutineTimePeriodEntity } from '@/core/todoList/dto/response/routine/RoutineTimePeriodEntity.ts'

const PARAM = 'offerFreeze'

/**
 * `?offerFreeze=<timePeriodId>` — arriving from a broken streak's summary notification, whose body
 * tells the user that spending a skip would bring the run back (P1-01 C). The parameter comes from
 * `NOTIFICATION_TYPE_INTENTS` in `public/notification-subject-routes.js`, so a bell click and a push
 * click both carry it.
 *
 * The notification's own "a skip would work" is only true for the moment it was raised. The skip
 * may since have been spent, or the budget used on another miss, or a newer period may have ended.
 * So the offer is decided again here by `coverableMiss`, which is the same rule behind the card's
 * own button. When it finds nothing, the arrival is just the usual focus on the card. A kept streak
 * carries the same parameter and gets the same result.
 */
export function useNotificationFreezeOffer() {
	const route = useRoute()
	const router = useRouter()
	const { coverableMiss, requestFreeze } = useStreakFreeze()

	/**
	 * The period the link asked about, or `null` when this navigation is not such a link. Drops the
	 * parameter either way, so a reload or a bookmark never asks twice.
	 */
	async function take(): Promise<number | null> {
		const raw = route.query[PARAM]
		const value = Array.isArray(raw) ? raw[0] : raw
		if (value == null) return null

		await router.replace({ query: { ...route.query, [PARAM]: undefined } })
		const id = Number(value)
		return Number.isInteger(id) && id > 0 ? id : null
	}

	/**
	 * Opens the skip confirm when the period still has a miss a skip can cover. Resolves `true` only
	 * when a skip was actually spent, so the caller knows to reload the server-owned streak.
	 */
	async function offer(timePeriod: RoutineTimePeriodEntity | undefined): Promise<boolean> {
		if (timePeriod === undefined) return false
		const miss = coverableMiss(timePeriod)
		if (miss === null) return false
		return (await requestFreeze(timePeriod, miss)) !== null
	}

	return { take, offer }
}

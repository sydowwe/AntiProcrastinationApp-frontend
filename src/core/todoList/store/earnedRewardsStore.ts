import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useUserStore } from '@/_common/modules/user/store/authStore.ts'
import { isoDateInUserZone } from '@/_common/composable/general/useUserClock.ts'
import { readUserScoped, writeUserScoped } from '@/core/user/composable/useUserScopedStorage.ts'
import { useDailyRecap } from '@/core/todoList/composable/useDailyRecap.ts'
import { waitingRewards } from '@/core/todoList/composable/earnedRewards.ts'
import type { EarnedReward, RewardObservation } from '@/core/todoList/composable/earnedRewards.ts'

/** `{ day, itemIds }` under the user-scoped key — the rewards started or let go on this device today. */
const RESOLVED_STORAGE_NAME = 'resolvedLeisureRewards'

interface ResolvedToday {
	day: string
	itemIds: number[]
}

function readResolved(): ResolvedToday | null {
	const raw = readUserScoped(RESOLVED_STORAGE_NAME)
	if (!raw) return null
	try {
		const parsed = JSON.parse(raw) as ResolvedToday
		return typeof parsed?.day === 'string' && Array.isArray(parsed.itemIds) ? parsed : null
	} catch {
		return null
	}
}

/**
 * Paired leisure rewards earned today and not yet started or let go — the place an earned reward
 * waits once the completion snackbar is gone.
 *
 * **"Earned" is the server's answer** (B2): the daily recap lists every item completed on the user's
 * day, from any device and any writer — a tick, a planner task, tracked time — with its pairing and
 * whether the reward has been taken (a history record of the paired activity started after the
 * completion). Nothing is pushed, so a completion elsewhere appears on the next recap read; `resync`
 * is that read.
 *
 * On top of it, two pieces of device state:
 * - **observations** — this tab's own ticks and unticks, so a reward appears (or goes) on the click,
 *   not a round trip later. Each one is dropped by the first recap read issued after it.
 * - **resolved** — rewards started or let go here. Started is hidden locally because a running
 *   timer has no history row yet, so the server still says "not taken"; let go ("Not today") is
 *   device-local by design. Both are per account and only for today: they live under a user-scoped
 *   key stamped with the day, and a stale day reads as empty. No tally of either is kept.
 */
export const useEarnedRewardsStore = defineStore(
	'earnedRewards',
	() => {
		const { recap, refresh: refreshRecap, reset: resetRecap } = useDailyRecap()

		const observations = ref<RewardObservation[]>([])
		let observationSeq = 0
		const resolved = ref<ResolvedToday | null>(readResolved())

		function resolvedIdsOn(day: string): Set<number> {
			return new Set(resolved.value?.day === day ? resolved.value.itemIds : [])
		}

		function writeResolved(itemIds: number[]) {
			const next = { day: isoDateInUserZone(), itemIds }
			resolved.value = next
			writeUserScoped(RESOLVED_STORAGE_NAME, JSON.stringify(next))
		}

		/** A tick this tab made. Shown straight away; the next landed recap read replaces it. */
		function observeCompleted(itemId: number, leisureActivityId: number, taskName: string) {
			observations.value = [
				...observations.value,
				{
					itemId,
					seq: ++observationSeq,
					earned: { itemId, leisureActivityId, taskName, earnedAt: new Date() },
				},
			]
		}

		/**
		 * An untick this tab made. It also clears the item's "resolved" mark, so ticking it again later
		 * today earns the reward again, as the first tick did.
		 */
		function observeReopened(itemId: number) {
			observations.value = [...observations.value, { itemId, seq: ++observationSeq, earned: null }]
			const today = isoDateInUserZone()
			if (resolvedIdsOn(today).has(itemId)) {
				writeResolved([...resolvedIdsOn(today)].filter(id => id !== itemId))
			}
		}

		/** Started or let go — either way it stops waiting on this device for the rest of the day. */
		function resolve(itemId: number) {
			const ids = resolvedIdsOn(isoDateInUserZone())
			ids.add(itemId)
			writeResolved([...ids])
		}

		/**
		 * Re-read the recap. Only a read that actually lands retires the observations it already
		 * reflects; a failed or superseded one leaves them standing, so a tick never flickers away.
		 */
		async function resync(): Promise<void> {
			const mark = observationSeq
			if (await refreshRecap()) {
				observations.value = observations.value.filter(observation => observation.seq > mark)
			}
		}

		/**
		 * The clock comes from the caller rather than from a timer here — the rendering component
		 * already holds the app's one-minute tick, and a store-owned interval would outlive it.
		 */
		function waitingAt(now: Date): EarnedReward[] {
			return waitingRewards(
				recap.value?.items ?? [],
				observations.value,
				resolvedIdsOn(isoDateInUserZone(now)),
				now,
			)
		}

		// A Pinia store is a singleton for the tab: signing in as someone else in the same tab would
		// otherwise hand them the previous account's recap, ticks and dismissals. The recap is reset
		// here too because it is module state shared with the list view's recap card, which had the
		// same leak.
		watch(
			() => useUserStore().currentUser.id,
			(id, previousId) => {
				// The resolved set is keyed by account, so it is re-read on every change, hydration included.
				resolved.value = readResolved()
				// `0 → id` is the hydration after a sign-in (`GET /user/data` resolving), not a user change:
				// nothing of another account can be held while the id is 0, because the reset below already
				// ran when it *became* 0. Resetting here discarded the recap read the freshly mounted home had
				// just issued, and the strip stayed empty until the next dashboard trigger — the same trap as
				// `useTodayPlan`'s F8.
				if (previousId === 0) return
				observations.value = []
				resetRecap()
			},
		)

		return { observeCompleted, observeReopened, resolve, resync, waitingAt }
	},
	{ persist: false },
)

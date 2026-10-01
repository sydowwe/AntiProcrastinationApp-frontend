import { isoDateInUserZone } from '@/_common/composable/general/useUserClock.ts'
import type { DailyRecapItem } from '@/core/todoList/dto/response/DailyRecap.ts'

/**
 * A paired leisure reward the user has earned by finishing a to-do item and has neither started nor
 * let go of. Temptation bundling only works while the want-to stays tied to the should-do, so the
 * item it was earned by travels with it — the waiting reward names the task it is for.
 */
export interface EarnedReward {
	itemId: number
	/** The backlog profile's activity id — a backlog profile's id IS its activity id. */
	leisureActivityId: number
	/** Display only: the reward says which task earned it. */
	taskName: string
	/** The completion instant — the server's `completedTimestamp`, or the tick this tab just made. */
	earnedAt: Date
}

/**
 * Does this reward still wait at `now`?
 *
 * An earned reward lives until the end of the user's day and then quietly goes. There is no "missed"
 * state and nothing counts the expired ones: a reward that waits forever turns into debt, and "4
 * rewards you never took" is four more things the user failed to do.
 *
 * "End of the user's day" is a question about two instants, so both are read in the user's zone —
 * `dayOf` defaults to `isoDateInUserZone` and is a parameter only so a test can pin the zone.
 */
export function isStillWaiting(
	reward: EarnedReward,
	now: Date,
	dayOf: (instant: Date) => string = isoDateInUserZone,
): boolean {
	if (Number.isNaN(reward.earnedAt.getTime())) return false
	// Same calendar day, not "within 24 hours": a reward earned at 23:50 is gone at midnight, which
	// is when the user's own sense of "today's rewards" resets too.
	return dayOf(reward.earnedAt) === dayOf(now)
}

export function stillWaiting(
	rewards: readonly EarnedReward[],
	now: Date,
	dayOf: (instant: Date) => string = isoDateInUserZone,
): EarnedReward[] {
	return rewards.filter(reward => isStillWaiting(reward, now, dayOf))
}

/**
 * A completion or reopen this tab performed itself, held only until a recap read issued after it
 * lands. It exists so a tick shows its reward (and an untick hides it) without waiting a round trip;
 * the server stays the source of truth. `earned: null` is a reopen.
 */
export interface RewardObservation {
	itemId: number
	/** Monotonic per store — what lets a landed read drop exactly the observations it already reflects. */
	seq: number
	earned: EarnedReward | null
}

/**
 * The rewards waiting at `now`: today's recap items that carry a pairing the server does not yet
 * count as taken, overlaid with this tab's unconfirmed ticks and unticks, minus the ones started or
 * let go on this device, minus anything no longer from the user's today. Oldest first.
 */
export function waitingRewards(
	recapItems: readonly DailyRecapItem[],
	observations: readonly RewardObservation[],
	resolvedItemIds: ReadonlySet<number>,
	now: Date,
	dayOf: (instant: Date) => string = isoDateInUserZone,
): EarnedReward[] {
	const byItem = new Map<number, EarnedReward>()
	for (const item of recapItems) {
		if (item.pairedLeisureActivityId == null || item.rewardTaken) continue
		byItem.set(item.itemId, {
			itemId: item.itemId,
			leisureActivityId: item.pairedLeisureActivityId,
			taskName: item.name,
			earnedAt: item.completedTimestamp,
		})
	}
	// Newest last, so the latest thing this tab did to an item is what holds.
	for (const observation of [...observations].sort((a, b) => a.seq - b.seq)) {
		if (observation.earned) byItem.set(observation.itemId, observation.earned)
		else byItem.delete(observation.itemId)
	}
	return stillWaiting(
		[...byItem.values()].filter(reward => !resolvedItemIds.has(reward.itemId)),
		now,
		dayOf,
	).sort((a, b) => a.earnedAt.getTime() - b.earnedAt.getTime())
}

import { describe, expect, it } from 'vitest'
import { isStillWaiting, stillWaiting, waitingRewards } from '@/core/todoList/composable/earnedRewards.ts'
import type { EarnedReward } from '@/core/todoList/composable/earnedRewards.ts'
import { DailyRecapItem } from '@/core/todoList/dto/response/DailyRecap.ts'

/**
 * The expiry rule for a waiting reward: it lives until the end of the user's day, in the user's zone.
 *
 * The zone is pinned through `dayOf` rather than read from the machine running the suite, so the
 * midnight edges below are the user's midnight whatever timezone CI happens to sit in.
 */

function dayIn(timeZone: string) {
	const formatter = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' })
	return (instant: Date) => formatter.format(instant)
}

const bratislava = dayIn('Europe/Bratislava')
const newYork = dayIn('America/New_York')

function reward(earnedAtIso: string, itemId = 1): EarnedReward {
	return { itemId, leisureActivityId: 100 + itemId, taskName: 'Write report', earnedAt: new Date(earnedAtIso) }
}

describe('isStillWaiting', () => {
	it('keeps a reward earned earlier the same day', () => {
		// 09:00 and 22:00 in Bratislava (UTC+2 in September).
		expect(isStillWaiting(reward('2026-09-28T07:00:00Z'), new Date('2026-09-28T20:00:00Z'), bratislava)).toBe(true)
	})

	it('keeps it up to the last minute of the day', () => {
		// 23:59:59 local.
		expect(isStillWaiting(reward('2026-09-28T07:00:00Z'), new Date('2026-09-28T21:59:59Z'), bratislava)).toBe(true)
	})

	it('drops it at the user’s midnight', () => {
		// 00:00 local on the 29th.
		expect(isStillWaiting(reward('2026-09-28T07:00:00Z'), new Date('2026-09-28T22:00:00Z'), bratislava)).toBe(false)
	})

	it('drops a reward earned a minute before midnight once midnight passes', () => {
		// Earned 23:59 local, read at 00:01 local — two minutes apart, still a different day.
		expect(isStillWaiting(reward('2026-09-28T21:59:00Z'), new Date('2026-09-28T22:01:00Z'), bratislava)).toBe(false)
	})

	it('answers in the user’s zone, not in UTC', () => {
		// 01:30 local in Bratislava is still the 28th in UTC. A UTC day boundary would call this the
		// previous day's reward and throw it away; the user's own clock says it was earned today.
		const earned = reward('2026-09-28T23:30:00Z')
		const now = new Date('2026-09-29T06:00:00Z')
		expect(isStillWaiting(earned, now, bratislava)).toBe(true)
		// The same two instants, for a user in New York: 19:30 on the 28th, then 02:00 on the 29th.
		expect(isStillWaiting(earned, now, newYork)).toBe(false)
	})

	it('drops a reward whose instant is unreadable rather than keeping it forever', () => {
		expect(isStillWaiting(reward('not a date'), new Date('2026-09-28T10:00:00Z'), bratislava)).toBe(false)
	})
})

describe('waitingRewards', () => {
	const now = new Date('2026-09-28T12:00:00Z')

	function recapItem(itemId: number, overrides: Partial<DailyRecapItem> = {}): DailyRecapItem {
		return Object.assign(
			new DailyRecapItem(`Task ${itemId}`, 0, itemId, 12007, new Date('2026-09-28T08:00:00Z'), false),
			overrides,
		)
	}

	function ids(rewards: EarnedReward[]) {
		return rewards.map(reward => reward.itemId)
	}

	it('offers a completed, paired, untaken recap item, named after its task', () => {
		const [reward] = waitingRewards([recapItem(1)], [], new Set(), now, bratislava)
		expect(reward).toEqual({
			itemId: 1,
			leisureActivityId: 12007,
			taskName: 'Task 1',
			earnedAt: new Date('2026-09-28T08:00:00Z'),
		})
	})

	it('skips items with no pairing and rewards the server counts as taken', () => {
		const items = [
			recapItem(1, { pairedLeisureActivityId: null }),
			recapItem(2, { rewardTaken: true }),
			recapItem(3),
		]
		expect(ids(waitingRewards(items, [], new Set(), now, bratislava))).toEqual([3])
	})

	it('hides what was started or let go on this device', () => {
		expect(ids(waitingRewards([recapItem(1), recapItem(2)], [], new Set([1]), now, bratislava))).toEqual([2])
	})

	it('shows a tick before the recap has caught up with it', () => {
		const earned = reward('2026-09-28T11:59:00Z', 5)
		expect(ids(waitingRewards([], [{ itemId: 5, seq: 1, earned }], new Set(), now, bratislava))).toEqual([5])
	})

	it('hides an untick before the recap has caught up with it', () => {
		expect(
			ids(waitingRewards([recapItem(1)], [{ itemId: 1, seq: 1, earned: null }], new Set(), now, bratislava)),
		).toEqual([])
	})

	it('lets the latest thing this tab did to an item win', () => {
		const earned = reward('2026-09-28T11:59:00Z', 1)
		const observations = [
			{ itemId: 1, seq: 2, earned },
			{ itemId: 1, seq: 1, earned: null },
		]
		expect(ids(waitingRewards([], observations, new Set(), now, bratislava))).toEqual([1])
	})

	it('drops a recap from yesterday once the user’s day has moved on', () => {
		// A tab left open over midnight still holds yesterday's recap until the next read.
		const late = recapItem(1, { completedTimestamp: new Date('2026-09-27T21:30:00Z') })
		expect(waitingRewards([late], [], new Set(), new Date('2026-09-27T22:30:00Z'), bratislava)).toEqual([])
	})

	it('lists the oldest reward first', () => {
		const items = [
			recapItem(1, { completedTimestamp: new Date('2026-09-28T10:00:00Z') }),
			recapItem(2, { completedTimestamp: new Date('2026-09-28T07:00:00Z') }),
		]
		expect(ids(waitingRewards(items, [], new Set(), now, bratislava))).toEqual([2, 1])
	})
})

describe('stillWaiting', () => {
	it('filters to today’s rewards and leaves no trace of the expired ones', () => {
		const yesterday = reward('2026-09-27T10:00:00Z', 1)
		const today = reward('2026-09-28T10:00:00Z', 2)
		const result = stillWaiting([yesterday, today], new Date('2026-09-28T12:00:00Z'), bratislava)
		expect(result).toEqual([today])
	})
})

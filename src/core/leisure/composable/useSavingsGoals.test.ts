import { describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import {
	summarizeSavingsGoals,
	useSavingsGoals,
	type SavingsGoalRow,
} from '@/core/leisure/composable/useSavingsGoals.ts'
import { ActivityBucketListProfileFilter } from '@/core/leisure/dto/request/ActivityBucketListProfileFilter.ts'

async function settle() {
	for (let i = 0; i < 4; i++) await nextTick()
}

function setup(rows: SavingsGoalRow[], itemsCount = rows.length, filter = new ActivityBucketListProfileFilter()) {
	const fetch = vi.fn(async () => ({ items: rows, itemsCount }))
	const filterRef = ref(filter)
	const savings = useSavingsGoals<SavingsGoalRow, ActivityBucketListProfileFilter>({
		fetch,
		filter: filterRef,
		cloneFilter: base => Object.assign(new ActivityBucketListProfileFilter(), base),
	})
	return { ...savings, fetch, filterRef }
}

describe('summarizeSavingsGoals', () => {
	it('splits the total into lived and remaining, ignoring rows without a positive goal', () => {
		const summary = summarizeSavingsGoals([
			{ financialGoal: 120, isAnchored: false },
			{ financialGoal: 300.5, isAnchored: true },
			{ financialGoal: null, isAnchored: true },
			{ financialGoal: 0, isAnchored: false },
		])
		expect(summary).toEqual({ total: 420.5, lived: 300.5, remaining: 120, goalCount: 2, completionKnown: true })
	})

	it('reports completion as unknown when no row carries it', () => {
		const summary = summarizeSavingsGoals([{ financialGoal: 50, isAnchored: null }])
		expect(summary.completionKnown).toBe(false)
		expect(summary.remaining).toBe(50)
	})
})

describe('useSavingsGoals', () => {
	it('shows the readout once a set with goals has loaded', async () => {
		const { visible, showLived, summary } = setup([{ financialGoal: 100, isAnchored: false }])
		await settle()
		expect(visible.value).toBe(true)
		expect(showLived.value).toBe(true)
		expect(summary.value.remaining).toBe(100)
	})

	it('hides rather than sum a truncated window', async () => {
		const { visible } = setup([{ financialGoal: 100, isAnchored: false }], 201)
		await settle()
		expect(visible.value).toBe(false)
	})

	it('hides when no entry has a goal', async () => {
		const { visible } = setup([{ financialGoal: null, isAnchored: false }])
		await settle()
		expect(visible.value).toBe(false)
	})

	it('drops the lived half when the filter already fixes completion, and hides entirely on "experienced only"', async () => {
		const filter = new ActivityBucketListProfileFilter()
		filter.isAnchored = false
		const { visible, showLived, filterRef } = setup([{ financialGoal: 100, isAnchored: false }], 1, filter)
		await settle()
		expect(visible.value).toBe(true)
		expect(showLived.value).toBe(false)

		filterRef.value.isAnchored = true
		await settle()
		expect(visible.value).toBe(false)
	})

	it('refetches on filter change and on refresh', async () => {
		const { fetch, filterRef, refresh } = setup([{ financialGoal: 100, isAnchored: false }])
		await settle()
		expect(fetch).toHaveBeenCalledTimes(1)
		filterRef.value.activityName = 'climb'
		await settle()
		expect(fetch).toHaveBeenCalledTimes(2)
		refresh()
		await settle()
		expect(fetch).toHaveBeenCalledTimes(3)
	})
})

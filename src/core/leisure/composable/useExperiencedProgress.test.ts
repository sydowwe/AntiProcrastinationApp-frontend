import { describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { useExperiencedProgress } from '@/core/leisure/composable/useExperiencedProgress.ts'
import { ActivityBucketListProfileFilter } from '@/core/leisure/dto/request/ActivityBucketListProfileFilter.ts'
import type { FilteredTableRequest } from '@/_common/dto/request/base/FilteredTableRequest.ts'

type Row = { isAnchored: boolean | null }

// Answers each call with the count registered for that request's `filter.isAnchored`, and records the
// filters it was called with so the tests can assert on the scoping.
function stubFetch(counts: { all: number; anchored: number }) {
	const seen: ActivityBucketListProfileFilter[] = []
	const fetch = vi.fn(async (request: FilteredTableRequest<ActivityBucketListProfileFilter>) => {
		const filter = request.filter as ActivityBucketListProfileFilter
		seen.push(filter)
		return { items: [], itemsCount: filter.isAnchored === true ? counts.anchored : counts.all }
	})
	return { fetch, seen }
}

function setup(rows: Row[], counts = { all: 17, anchored: 4 }, filter = new ActivityBucketListProfileFilter()) {
	const { fetch, seen } = stubFetch(counts)
	const items = ref<Row[]>(rows)
	const filterRef = ref(filter)
	const progress = useExperiencedProgress<Row, ActivityBucketListProfileFilter>({
		fetch,
		filter: filterRef,
		items,
		cloneFilter: base => Object.assign(new ActivityBucketListProfileFilter(), base),
	})
	return { ...progress, items, filterRef, fetch, seen }
}

// Lets the immediate watcher and both sequential awaits settle.
async function settle() {
	for (let i = 0; i < 4; i++) await nextTick()
}

describe('useExperiencedProgress', () => {
	it('stays hidden and issues no request while the API does not carry the field', async () => {
		const { visible, fetch } = setup([{ isAnchored: null }, { isAnchored: null }])
		await settle()
		expect(visible.value).toBe(false)
		expect(fetch).not.toHaveBeenCalled()
	})

	it('counts once the field appears, and reports the fraction', async () => {
		const { visible, done, total, items } = setup([{ isAnchored: null }])
		await settle()

		items.value = [{ isAnchored: false }, { isAnchored: true }]
		await settle()

		expect(visible.value).toBe(true)
		expect(done.value).toBe(4)
		expect(total.value).toBe(17)
	})

	it('takes the two counts under the same filter, differing only in isAnchored', async () => {
		const filter = new ActivityBucketListProfileFilter('surf', [4], null, null, null)
		const { seen } = setup([{ isAnchored: false }], { all: 9, anchored: 2 }, filter)
		await settle()

		expect(seen).toHaveLength(2)
		expect(seen.map(f => f.isAnchored)).toEqual([null, true])
		// The user's own filter survives into both counts, so the fraction matches what is on screen.
		expect(seen.every(f => f.activityName === 'surf')).toBe(true)
		expect(seen.every(f => f.experienceTypeIds?.length === 1)).toBe(true)
		// A copy, never the live filter — mutating it would have flipped the panel's own checkbox.
		expect(filter.isAnchored).toBeNull()
	})

	it('stands down when the user is already filtering on completion', async () => {
		const filter = new ActivityBucketListProfileFilter()
		filter.isAnchored = true
		const { visible, fetch } = setup([{ isAnchored: true }], { all: 4, anchored: 4 }, filter)
		await settle()

		expect(visible.value).toBe(false)
		expect(fetch).not.toHaveBeenCalled()
	})

	it('recount() picks up an anchor created from the table, which no watcher can see', async () => {
		const { done, recount, fetch } = setup([{ isAnchored: false }], { all: 17, anchored: 4 })
		await settle()
		expect(done.value).toBe(4)

		// The row was anchored elsewhere; the filter never moved, so only an explicit recount refreshes it.
		fetch.mockImplementation(async request => ({
			items: [],
			itemsCount: (request.filter as ActivityBucketListProfileFilter).isAnchored === true ? 5 : 17,
		}))
		recount()
		await settle()

		expect(done.value).toBe(5)
	})

	it('hides rather than showing a stale fraction when a count fails', async () => {
		const { visible, fetch, recount } = setup([{ isAnchored: false }])
		await settle()
		expect(visible.value).toBe(true)

		fetch.mockRejectedValue(new Error('boom'))
		recount()
		await settle()

		expect(visible.value).toBe(false)
	})

	it('does not recount on a page or sort change, which cannot move either number', async () => {
		const { fetch, items } = setup([{ isAnchored: false }])
		await settle()
		expect(fetch).toHaveBeenCalledTimes(2)

		// A new page of rows: `items` is replaced, but the set being counted is identical.
		items.value = [{ isAnchored: true }, { isAnchored: false }]
		await settle()

		expect(fetch).toHaveBeenCalledTimes(2)
	})
})

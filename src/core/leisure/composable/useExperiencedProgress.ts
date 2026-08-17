import { computed, ref, watch, type Ref } from 'vue'
import { FilteredTableRequest } from '@/_common/dto/request/base/FilteredTableRequest.ts'
import type { IFilterRequest } from '@/_common/dto/request/interface/IFilterRequest.ts'
import type { TableFetch } from '@/_common/composable/table/useServerTable.ts'

export interface AnchorableFilter extends IFilterRequest {
	isAnchored: boolean | null
}

export interface AnchorableItem {
	isAnchored: boolean | null
}

export interface ExperiencedProgressOptions<TItem extends AnchorableItem, TFilter extends AnchorableFilter> {
	/** Must come from its OWN api-composable instance: `useFetchFilteredTable` aborts its previous
	 *  request, so sharing the table's instance would cancel the table's own fetch. */
	fetch: TableFetch<TItem, TFilter>
	/** The table's live filter. Both counts are taken under it, so the readout matches what is on screen. */
	filter: Ref<TFilter>
	/** Whatever rows are currently on screen — the only honest signal for whether the API carries
	 *  completion. A view with more than one presentation must pass the visible one, or the readout
	 *  stays hidden in the presentation whose rows never load. */
	items: Readonly<Ref<TItem[]>>
	/** Copy of the caller's concrete filter class, so the counts keep its prototype and defaults. */
	cloneFilter: (base: TFilter) => TFilter
	/** Narrow the copy to the rows that can ever be completed (the backlog's one-time half). */
	scopeFilter?: (copy: TFilter) => void
	/** Whether a fraction means anything under the user's current filter. Defaults to "not already
	 *  filtering on completion", which would otherwise read "4 of 4". */
	applicable?: (current: TFilter) => boolean
}

// "4 of 17 experienced" — the only completion metric the leisure module can honestly show.
//
// Two count-only requests (page size 1) under the current filter: the denominator over everything
// that can be completed, the numerator over the same set with `isAnchored: true`. Intersecting the
// loaded page against the anchors table would look cheaper and be wrong — page 2's anchors are not
// in the response you have.
export function useExperiencedProgress<TItem extends AnchorableItem, TFilter extends AnchorableFilter>(
	options: ExperiencedProgressOptions<TItem, TFilter>,
) {
	const { fetch, filter, items, cloneFilter, scopeFilter, applicable } = options

	const done = ref(0)
	const total = ref(0)
	const loaded = ref(false)

	// An API that does not carry the field yet leaves every row's `isAnchored` at null (fromJson's
	// default), so the whole readout stays hidden rather than reporting a confident zero.
	const supported = computed(() => items.value.some(item => item.isAnchored !== null))
	const meaningful = computed(() => (applicable ?? (f => f.isAnchored == null))(filter.value))
	const visible = computed(() => supported.value && meaningful.value && loaded.value && total.value > 0)

	function scopedFilter(anchored: boolean | null): TFilter {
		const copy = cloneFilter(filter.value)
		scopeFilter?.(copy)
		copy.isAnchored = anchored
		return copy
	}

	let token = 0
	async function loadCounts() {
		if (!supported.value || !meaningful.value) {
			loaded.value = false
			return
		}
		const current = ++token
		try {
			// Sequential, not Promise.all: both calls share one `useFetchFilteredTable` instance, and it
			// aborts its own previous request — issued together, the first would resolve with the
			// second's result and the fraction would read "n of n".
			const all = await fetch(new FilteredTableRequest<TFilter>(1, 1, [], true, scopedFilter(null)))
			if (current !== token) return
			const anchored = await fetch(new FilteredTableRequest<TFilter>(1, 1, [], true, scopedFilter(true)))
			if (current !== token) return
			total.value = all.itemsCount
			done.value = anchored.itemsCount
			loaded.value = true
		} catch {
			// The table itself already surfaced any failure; a missing progress strip is not worth a
			// second snackbar.
			if (current === token) loaded.value = false
		}
	}

	// Deliberately NOT watching `items`: it is replaced on every page and sort change, neither of which
	// moves a count. `supported` is watched only for its one flip, when the first response carrying the
	// field arrives.
	watch([supported, meaningful, filter], () => void loadCounts(), { deep: true, immediate: true })

	// Anything that changes the underlying set — creating an anchor, adding or deleting a profile —
	// happens through the table's reload, which the filter watch above cannot see. Call this there, or
	// the fraction silently keeps the value it had before the user marked something done.
	function recount() {
		void loadCounts()
	}

	return { done, total, visible, recount }
}

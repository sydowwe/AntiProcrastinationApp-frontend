import { computed, ref, watch, type Ref } from 'vue'
import { FilteredTableRequest } from '@/_common/dto/request/base/FilteredTableRequest.ts'
import type { TableFetch } from '@/_common/composable/table/useServerTable.ts'
import type { AnchorableFilter } from '@/core/leisure/composable/useExperiencedProgress.ts'

export interface SavingsGoalRow {
	financialGoal: number | null
	isAnchored: boolean | null
}

export interface SavingsGoalSummary {
	/** Sum of every positive goal in the set. */
	total: number
	/** The part of `total` whose entry has been experienced. */
	lived: number
	/** The part of `total` still ahead — what there is left to save for. */
	remaining: number
	/** How many entries carry a goal at all. Zero hides the readout. */
	goalCount: number
	/** Whether any row carries completion. Without it `lived` is not a zero, it is unknown. */
	completionKnown: boolean
}

// A missing, zero or negative goal is "no goal", not a free experience — it adds nothing to either side.
export function summarizeSavingsGoals(rows: readonly SavingsGoalRow[]): SavingsGoalSummary {
	let total = 0
	let lived = 0
	let goalCount = 0
	for (const row of rows) {
		if (row.financialGoal == null || row.financialGoal <= 0) continue
		goalCount++
		total += row.financialGoal
		if (row.isAnchored === true) lived += row.financialGoal
	}
	return {
		total,
		lived,
		remaining: total - lived,
		goalCount,
		completionKnown: rows.some(row => row.isAnchored !== null),
	}
}

// The server's `itemsPerPage` cap. The sum needs every row under the filter, not the table's page.
const SUM_PAGE_SIZE = 200

export interface SavingsGoalsOptions<TItem extends SavingsGoalRow, TFilter extends AnchorableFilter> {
	/** Must come from its OWN api-composable instance, for the same reason as `useExperiencedProgress`. */
	fetch: TableFetch<TItem, TFilter>
	/** The table's live filter, so the readout sums what is on screen. */
	filter: Ref<TFilter>
	cloneFilter: (base: TFilter) => TFilter
}

// "Still to save: 1 240" — the bucket list's `financialGoal`, summed under the current filter.
//
// Unlike the experienced fraction this cannot be two count-only requests: a sum needs the rows. One
// page at the server's cap is enough for a bucket list; a set larger than that would sum a truncated
// window, so the readout hides instead of showing a confident wrong number.
export function useSavingsGoals<TItem extends SavingsGoalRow, TFilter extends AnchorableFilter>(
	options: SavingsGoalsOptions<TItem, TFilter>,
) {
	const { fetch, filter, cloneFilter } = options

	const summary = ref<SavingsGoalSummary>(summarizeSavingsGoals([]))
	const complete = ref(false)
	const loaded = ref(false)

	// Filtering to experienced entries only leaves nothing still to save — the readout would say "0".
	const visible = computed(
		() => loaded.value && complete.value && summary.value.goalCount > 0 && filter.value.isAnchored !== true,
	)
	// "Lived X of Y" means nothing when the filter already fixed completion, or the API does not carry it.
	const showLived = computed(() => summary.value.completionKnown && filter.value.isAnchored == null)

	let token = 0
	async function load() {
		const current = ++token
		try {
			const result = await fetch(
				new FilteredTableRequest<TFilter>(SUM_PAGE_SIZE, 1, [], true, cloneFilter(filter.value)),
			)
			if (current !== token) return
			summary.value = summarizeSavingsGoals(result.items)
			complete.value = result.itemsCount <= result.items.length
			loaded.value = true
		} catch {
			// The table already surfaced any failure; a missing readout is not worth a second snackbar.
			if (current === token) loaded.value = false
		}
	}

	watch(filter, () => void load(), { deep: true, immediate: true })

	/** Call on every reload that can change the set — an edited goal, a new anchor, a deleted entry. */
	function refresh() {
		void load()
	}

	return { summary, visible, showLived, refresh }
}

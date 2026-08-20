import { ref, type ComputedRef, type Ref } from 'vue'
import { watchDebounced } from '@vueuse/core'
import axios from 'axios'
import { getUnifiedSourceBreakdown } from '@/core/activityTracking/api/unifiedActivityTrackingApi.ts'
import { UnifiedActivityRequest } from '@/core/activityTracking/dto/request/unified/UnifiedActivityRequest.ts'
import type { UnifiedSourceBreakdown } from '@/core/activityTracking/dto/response/unified/UnifiedSourceBreakdown.ts'
import type { ActivitySource } from '@/core/activityTracking/dto/enum/ActivitySource.ts'
import {
	ACTIVITY_FETCH_DEBOUNCE_MS,
	type ActivityDashboardRange,
} from '@/core/activityTracking/composable/useActivityDashboard.ts'

/**
 * The fifth panel of the unified dashboard, and the only one `useActivityDashboard` knows nothing
 * about: what each tracker contributed to the merged span, and what the overlap rule took from it.
 *
 * It is its own round rather than a sixth fetcher on the shared composable because it is the one panel
 * that must survive the others — the source filter it drives is how a user recovers from a bad
 * selection, so it keeps loading and failing independently of whether the charts did. It carries the
 * same abort-per-round discipline as the four shared panels, and the same debounce, so a scrub of the
 * time picker settles everything on one rhythm.
 */
export function useUnifiedSourceBreakdown(range: ComputedRef<ActivityDashboardRange>, sources: Ref<ActivitySource[]>) {
	const breakdown = ref<UnifiedSourceBreakdown[]>([]) as Ref<UnifiedSourceBreakdown[]>
	const breakdownLoading = ref(false)
	const breakdownError = ref(false)

	let controller: AbortController | null = null

	async function fetchBreakdown() {
		controller?.abort()
		const round = new AbortController()
		controller = round
		breakdownLoading.value = true
		breakdownError.value = false
		try {
			const data = await getUnifiedSourceBreakdown(
				new UnifiedActivityRequest(
					range.value.dateFrom,
					range.value.dateTo,
					range.value.timeFrom,
					range.value.timeTo,
					sources.value,
				),
				round.signal,
			)
			if (controller === round) {
				breakdown.value = data
			}
		} catch (error) {
			if (axios.isCancel(error)) return
			breakdownError.value = true
		} finally {
			if (controller === round) {
				breakdownLoading.value = false
			}
		}
	}

	watchDebounced([range, sources], fetchBreakdown, { immediate: true, debounce: ACTIVITY_FETCH_DEBOUNCE_MS })

	return { breakdown, breakdownLoading, breakdownError, fetchBreakdown }
}

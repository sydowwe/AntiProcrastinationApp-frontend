import { onMounted, ref, type Ref, watch } from 'vue'
import type { LookupResponse } from '@/_common/dto/response/general/LookupResponse.ts'
import { useActivityExpectedCostTierApi, useActivityLocationTypeApi } from '@/core/leisure/api/activityLookupApi.ts'
import { useLeisureSuggestionApi } from '@/core/leisure/api/leisureSuggestionApi.ts'
import type { LeisureSuggestion } from '@/core/leisure/dto/response/LeisureSuggestion.ts'
import { type PickerConstraints, SUGGESTION_COUNT } from '@/core/leisure/composable/pickerConstraints.ts'
import { useWeatherFit } from '@/core/leisure/composable/useWeatherFit.ts'
import type { WeatherFit } from '@/core/leisure/dto/response/WeatherFit.ts'

/**
 * Asks the server for three suggestions (F2-04).
 *
 * This used to fetch up to 200 rows of each profile table and rank them here, which ranked a large backlog over
 * a prefix of it, could not see today's weather server-side, and remembered what it showed only per device. The
 * draw (`POST /leisure-suggestion`) now does all of that: every row, the weather, and a history shared across
 * devices. What is left here is asking at the right moments and keeping a slower answer from overwriting a
 * newer one.
 *
 * Every change to the constraints or the seed is a round trip now, energy and party size included — they are
 * ranked server-side. The seed is what keeps a reload showing the same three cards.
 */

export interface LeisurePicker {
	suggestions: Ref<LeisureSuggestion[]>
	loading: Ref<boolean>
	/**
	 * Profiles filed, before any constraint. Distinguishes the two empty states: 0 means nothing is filed at all,
	 * non-zero with no suggestions means something needs relaxing.
	 */
	poolCount: Ref<number>
	/**
	 * The most recent draw failed. Distinct from an empty pool: without this, a network error renders as "you
	 * have nothing filed yet", which blames the user for the server's problem.
	 */
	loadFailed: Ref<boolean>
	costTierOptions: Ref<LookupResponse[]>
	locationTypeOptions: Ref<LookupResponse[]>
	/** Today's weather fit, for the card's badge — see `SuggestionCard`. The ranking reads it server-side. */
	weatherFit: Ref<WeatherFit | null>
	/**
	 * Some backlog row in the pool depends on the weather, so a weather signal would change the draw. Gates the
	 * "set your location" hint: without such a row, asking for a location promises an effect the user would
	 * never see.
	 */
	hasWeatherDependentCandidates: Ref<boolean>
}

export function useLeisurePicker(constraints: Ref<PickerConstraints>, seed: Ref<number>): LeisurePicker {
	const { draw } = useLeisureSuggestionApi()
	const { fetchAll: fetchCostTiers } = useActivityExpectedCostTierApi()
	const { fetchAll: fetchLocationTypes } = useActivityLocationTypeApi()
	// Fired alongside the first draw, never awaited by it: it paints the badge, and it warms the server's
	// forecast cache so the draw's own bounded weather wait finds an answer.
	const weatherFit = useWeatherFit()

	const suggestions = ref<LeisureSuggestion[]>([])
	const loading = ref(true)
	const poolCount = ref(0)
	const loadFailed = ref(false)
	const costTierOptions = ref<LookupResponse[]>([])
	const locationTypeOptions = ref<LookupResponse[]>([])
	const hasWeatherDependentCandidates = ref(false)

	// Guards against an older draw finishing after a newer one and overwriting its cards. The abort saves the
	// server the work; the token is what actually keeps the screen honest.
	let drawToken = 0
	let inFlight: AbortController | null = null

	async function redraw(): Promise<void> {
		const current = constraints.value
		const token = ++drawToken
		inFlight?.abort()
		const controller = new AbortController()
		inFlight = controller
		loading.value = true
		try {
			const result = await draw(
				{
					minutes: current.minutes,
					energy: current.energy,
					people: current.people,
					maxCostTierId: current.maxCostTierId,
					locationTypeId: current.locationTypeId,
					seed: seed.value,
					count: SUGGESTION_COUNT,
				},
				controller.signal,
			)
			if (token !== drawToken) return
			loadFailed.value = false
			suggestions.value = result.items
			poolCount.value = result.poolCount
			hasWeatherDependentCandidates.value = result.hasWeatherDependentCandidates
		} catch {
			if (token !== drawToken) return
			// The interceptor has already told the user (a cancellation shows nothing and never gets here — the
			// token moved on). Leave the previous cards in place rather than blanking them, and flag the failure
			// so an empty screen is not read as "you have nothing filed".
			loadFailed.value = true
		} finally {
			if (token === drawToken) {
				loading.value = false
				inFlight = null
			}
		}
	}

	onMounted(async () => {
		// The lookups only populate two optional selects. Failures are swallowed rather than propagated, so a
		// broken lookup never leaves the whole view on its skeleton. Not awaited before the draw: the server
		// resolves a cost tier through its own `sortOrder`, so the draw no longer needs them.
		fetchCostTiers()
			.then(tiers => (costTierOptions.value = tiers))
			.catch(() => undefined)
		fetchLocationTypes()
			.then(types => (locationTypeOptions.value = types))
			.catch(() => undefined)
		await redraw()
	})

	watch(constraints, redraw, { deep: true })
	watch(seed, redraw)

	return {
		suggestions,
		loading,
		poolCount,
		loadFailed,
		costTierOptions,
		locationTypeOptions,
		weatherFit,
		hasWeatherDependentCandidates,
	}
}

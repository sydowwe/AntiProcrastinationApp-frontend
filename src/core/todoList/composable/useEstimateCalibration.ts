import { ref } from 'vue'
import type { Time } from '@/_common/dto/dto/Time.ts'
import { fetchActivityLoggedTimeAggregate } from '@/core/activityHistory/api/activityHistoryApi.ts'
import type { ActivityLoggedTimeAggregate } from '@/core/activityHistory/dto/response/ActivityLoggedTimeAggregate.ts'

/**
 * Estimate-vs-actual calibration (Kahneman & Tversky's planning fallacy; Buehler, Griffin & Ross).
 * Purely informational — see prompts/todo-motivation/S3-estimate-vs-actual.md. Framing must stay
 * neutral, never scolding: this tells the user how their estimates compare to reality, nothing more.
 *
 * Cross-module contact is limited to activityHistory's `api/` and `dto/`, per CLAUDE.md.
 */

const MIN_COMPARABLE_ITEMS = 5

// Module-scoped, like useLeisurePairing: several list views mount their own composable instance but
// should share one cache instead of one request per view per activity.
const aggregatesByActivityId = ref<Map<number, ActivityLoggedTimeAggregate>>(new Map())
const loadedActivityIds = new Set<number>()
let loadPromise: Promise<void> | null = null

export function useEstimateCalibration() {
	/** Idempotent per activity id. Safe to call from every consumer's `onMounted`. */
	function ensureLoaded(activityIds: number[]): Promise<void> {
		const missing = [...new Set(activityIds)].filter(id => !loadedActivityIds.has(id))
		if (missing.length === 0) return loadPromise ?? Promise.resolve()
		loadPromise = fetchActivityLoggedTimeAggregate(missing)
			.then(result => {
				for (const aggregate of result) aggregatesByActivityId.value.set(aggregate.activityId, aggregate)
				for (const id of missing) loadedActivityIds.add(id)
			})
			.catch(() => {
				// Leave loadedActivityIds untouched so the next mount retries instead of caching the failure.
			})
		return loadPromise
	}

	function averageActualFor(activityId: number): Time | null {
		const aggregate = aggregatesByActivityId.value.get(activityId)
		if (!aggregate || aggregate.entryCount === 0) return null
		return aggregate.averageTime
	}

	/**
	 * One ratio per item (actual / suggested), averaged — not sum-of-actual / sum-of-suggested — so a
	 * single long task can't dominate the number shown to the user. `null` below the comparable-items
	 * threshold: a ratio built from one or two tasks reads as a fact when it's closer to noise.
	 */
	function calibrationRatio(
		items: { activityId: number; suggestedSeconds: number }[],
	): { ratio: number; comparableCount: number } | null {
		const ratios: number[] = []
		for (const item of items) {
			if (item.suggestedSeconds <= 0) continue
			const aggregate = aggregatesByActivityId.value.get(item.activityId)
			if (!aggregate || aggregate.entryCount === 0) continue
			ratios.push(aggregate.totalSeconds / aggregate.entryCount / item.suggestedSeconds)
		}
		if (ratios.length < MIN_COMPARABLE_ITEMS) return null
		return {
			ratio: ratios.reduce((sum, r) => sum + r, 0) / ratios.length,
			comparableCount: ratios.length,
		}
	}

	return { ensureLoaded, averageActualFor, calibrationRatio }
}

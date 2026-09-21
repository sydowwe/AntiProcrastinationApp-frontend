import { computed } from 'vue'
import { useRoute, type LocationQueryRaw } from 'vue-router'
import { MappingCoverage } from '@/core/activityTracking/dto/enum/MappingCoverage.ts'
import { convertToEnum } from '@/_common/utils/enumHelpers.ts'

/**
 * The two query params the settings views keep in the URL (B24):
 *
 * - `coverage` on the distinct-entries tab — the three-way filter. Absent means `All`, the server's
 *   default, so the bare URL stays the raw observation record and `Uncovered` / `Covered` are what get
 *   bookmarked. A value the enum does not know reads as `All` rather than reaching the validator's 400.
 * - `mappingId` on the Mappings tab — the rule a *Rule* chip linked to, tinted when it is on the page.
 *
 * There is no watcher here on purpose: the view writes the query in the same handler that applies the
 * filter (`F15`'s two-writer trap — `edit()` mutates the filter and pushes a route in one tick).
 */
export function useCoverageUrlState() {
	const route = useRoute()

	const coverageFromRoute = computed<MappingCoverage | null>(() => {
		const raw = route.query.coverage
		const parsed = typeof raw === 'string' ? convertToEnum(MappingCoverage, raw) : undefined
		return parsed == null || parsed === MappingCoverage.All ? null : parsed
	})

	const highlightedMappingId = computed<number | null>(() => {
		const raw = route.query.mappingId
		const id = typeof raw === 'string' ? Number(raw) : NaN
		return Number.isInteger(id) && id > 0 ? id : null
	})

	/** The distinct-entries tab's query for a filter value — empty for `All`, so the default URL stays bare. */
	function coverageQuery(coverage: MappingCoverage | null): LocationQueryRaw {
		return coverage == null || coverage === MappingCoverage.All ? {} : { coverage }
	}

	return { coverageFromRoute, highlightedMappingId, coverageQuery }
}

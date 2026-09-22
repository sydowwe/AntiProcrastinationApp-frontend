import { computed } from 'vue'
import { useRoute, type LocationQuery, type LocationQueryRaw } from 'vue-router'
import { MappingCoverage } from '@/core/activityTracking/dto/enum/MappingCoverage.ts'
import { PatternMatchType } from '@/_common/dto/enum/PatternMatchType.ts'
import { convertToEnum } from '@/_common/utils/enumHelpers.ts'

type KeysOfType<T, V> = { [K in keyof T]-?: T[K] extends V ? K : never }[keyof T]

/** One text field and its match-type twin — the pair both distinct-entries filters are built from. */
export interface PatternField<TFilter> {
	text: KeysOfType<TFilter, string | undefined>
	matchType: KeysOfType<TFilter, PatternMatchType>
}

/**
 * The params `useTableUrlState` owns inside a grid — its page/size/sort, and on the Mappings tab the tab's
 * own controls. The view's pattern filter writes around them, never over them.
 */
const TABLE_PARAMS = ['page', 'perPage', 'sortBy', 'type', 'isActive', 'isIgnored', 'activityId'] as const

function firstValue(raw: LocationQuery[string]): string | undefined {
	const first = Array.isArray(raw) ? raw[0] : raw
	return typeof first === 'string' && first !== '' ? first : undefined
}

/** The Mappings tab's own controls — the part of either platform's mappings filter that is not the pattern. */
export interface MappingsControls<TType extends string> {
	type: TType
	isActive: boolean | null
	isIgnored: boolean | null
	activityId: number | null
}

function parseNullableBoolean(raw: string | undefined): boolean | null {
	return raw === 'true' ? true : raw === 'false' ? false : null
}

/**
 * `useTableUrlState`'s `filterToParams` for the Mappings tab (F13, F15). A default writes `''`, which
 * that composable deletes, so an untouched tab keeps a bare URL. `isIgnored` and `activityId` are written
 * only for the type that shows their control, matching what the grid request sends.
 */
export function mappingsControlsToParams<TType extends string>(
	controls: MappingsControls<TType>,
	defaultType: TType,
	ignoredType: TType,
): Record<string, string> {
	const isIgnoredType = controls.type === ignoredType
	return {
		type: controls.type === defaultType ? '' : controls.type,
		isActive: controls.isActive == null ? '' : String(controls.isActive),
		isIgnored: isIgnoredType && controls.isIgnored != null ? String(controls.isIgnored) : '',
		activityId: !isIgnoredType && controls.activityId != null ? String(controls.activityId) : '',
	}
}

/** The inverse — writes whatever the params name onto a fresh filter; an unknown value keeps the default. */
export function applyMappingsControlsParams<TType extends string, TFilter extends MappingsControls<TType>>(
	filter: TFilter,
	params: Record<string, string>,
	types: readonly TType[],
): TFilter {
	const type = types.find(value => value === params.type)
	if (type !== undefined) filter.type = type
	filter.isActive = parseNullableBoolean(params.isActive)
	filter.isIgnored = parseNullableBoolean(params.isIgnored)
	const activityId = Number(params.activityId)
	filter.activityId = Number.isInteger(activityId) && activityId > 0 ? activityId : null
	return filter
}

/**
 * The query params the settings views keep in the URL (B24, F15):
 *
 * - every text field of the distinct-entries filter plus its match type — the text when non-empty, the
 *   match type when it is not the `Contains` default, so a bare URL is the untouched form;
 * - `coverage` on the distinct-entries tab — the three-way filter. Absent means `All`, the server's
 *   default, so the bare URL stays the raw observation record and `Uncovered` / `Covered` are what get
 *   bookmarked. A value the enum does not know reads as `All` rather than reaching the validator's 400;
 * - `mappingId` on the Mappings tab — the rule a *Rule* chip linked to, tinted when it is on the page.
 *
 * `page` / `perPage` / `sortBy` are the grid's, written by `useTableUrlState` inside the table — and on
 * the Mappings tab so are `type` / `isActive` / `isIgnored` / `activityId` (`mappingsControlsToParams`).
 * The filter side only carries them across its own writes (`withTableParams`).
 *
 * There is no watcher here on purpose: the view writes the query in the same handler that applies the
 * filter (the two-writer trap — `edit()` mutates the filter and pushes a route in one tick).
 */
export function useDistinctEntriesUrlState<TFilter extends { coverage: MappingCoverage | null }>(
	fields: PatternField<TFilter>[],
	filterFactory: () => TFilter,
) {
	const route = useRoute()

	const highlightedMappingId = computed<number | null>(() => {
		const raw = route.query.mappingId
		const id = typeof raw === 'string' ? Number(raw) : NaN
		return Number.isInteger(id) && id > 0 ? id : null
	})

	function coverageFromQuery(query: LocationQuery): MappingCoverage | null {
		const raw = firstValue(query.coverage)
		const parsed = raw === undefined ? undefined : convertToEnum(MappingCoverage, raw)
		return parsed == null || parsed === MappingCoverage.All ? null : parsed
	}

	/** A filter built from the current URL — the defaults for everything the query does not name. */
	function filterFromRoute(): TFilter {
		const filter = filterFactory()
		for (const { text, matchType } of fields) {
			const textValue = firstValue(route.query[text as string])
			if (textValue !== undefined) filter[text] = textValue as TFilter[typeof text]
			const matchRaw = firstValue(route.query[matchType as string])
			const parsedMatch = matchRaw === undefined ? undefined : convertToEnum(PatternMatchType, matchRaw)
			if (parsedMatch !== undefined) filter[matchType] = parsedMatch as TFilter[typeof matchType]
		}
		filter.coverage = coverageFromQuery(route.query)
		return filter
	}

	/** The query for a filter value — empty for the default filter, so the bare URL stays bare. */
	function filterQuery(filter: TFilter): LocationQueryRaw {
		const query: LocationQueryRaw = {}
		for (const { text, matchType } of fields) {
			const textValue = filter[text]
			if (typeof textValue === 'string' && textValue !== '') query[text as string] = textValue
			const matchValue = filter[matchType]
			if (matchValue !== PatternMatchType.Contains) query[matchType as string] = matchValue as string
		}
		if (filter.coverage != null && filter.coverage !== MappingCoverage.All) query.coverage = filter.coverage
		return query
	}

	/** `query` plus whatever page/size/sort the grid currently has in the URL, so a filter write keeps them. */
	function withTableParams(query: LocationQueryRaw): LocationQueryRaw {
		const merged: LocationQueryRaw = { ...query }
		for (const key of TABLE_PARAMS) {
			if (route.query[key] !== undefined) merged[key] = route.query[key]
		}
		return merged
	}

	return { highlightedMappingId, filterFromRoute, filterQuery, withTableParams }
}

import type { LocationQuery } from 'vue-router'
import { ActivityFilter } from '@/core/activity/dto/request/ActivityFilter.ts'
import { NameTextFilter } from '@/core/activity/dto/request/NameTextFilter.ts'
import type { SelectOption } from '@/_common/dto/response/general/SelectOption.ts'

/**
 * Pure parse/serialize helpers for `ActivitySettingsView`'s query params (theme D). None of them
 * touch component state — they are just the route <-> filter mapping, the same split
 * `activityHistory/composable/historyUrlParams.ts` makes for the history views.
 */

export function firstQueryString(value: unknown): string | undefined {
	const raw = Array.isArray(value) ? value.find(v => typeof v === 'string') : value
	return typeof raw === 'string' && raw !== '' ? raw : undefined
}

export function parseIdList(value: unknown): number[] | null {
	const raw = firstQueryString(value)
	if (!raw) return null
	const ids = raw
		.split(',')
		.map(part => Number(part))
		.filter(n => Number.isInteger(n))
	return ids.length > 0 ? ids : null
}

/**
 * Which lifecycle state the activities tab is showing. Three named views rather than a raw boolean
 * because the URL has to say which one it is, and `archived=false` vs. `archived=` vs. absent is not
 * a distinction a query string carries legibly.
 */
export type ArchivedView = 'active' | 'archived' | 'all'

export const ARCHIVED_VIEW_FILTER: Record<ArchivedView, boolean | null> = {
	active: false,
	archived: true,
	all: null,
}

export function parseArchivedView(value: unknown): ArchivedView {
	const raw = firstQueryString(value)
	return raw === 'archived' || raw === 'all' ? raw : 'active'
}

export function archivedViewOf(isArchived: boolean | null): ArchivedView {
	if (isArchived === true) return 'archived'
	if (isArchived === null) return 'all'
	return 'active'
}

export function paramsToActivityFilter(query: LocationQuery): ActivityFilter {
	return new ActivityFilter(
		firstQueryString(query.name) ?? null,
		firstQueryString(query.text) ?? null,
		firstQueryString(query.roleName) ?? null,
		parseIdList(query.roleIds),
		firstQueryString(query.categoryName) ?? null,
		parseIdList(query.categoryIds),
		ARCHIVED_VIEW_FILTER[parseArchivedView(query.archived)],
	)
}

export function activityFilterToParams(filter: ActivityFilter): Record<string, string> {
	const params: Record<string, string> = {}
	if (filter.name) params.name = filter.name
	if (filter.text) params.text = filter.text
	if (filter.roleIds?.length) params.roleIds = filter.roleIds.join(',')
	if (filter.roleName) params.roleName = filter.roleName
	if (filter.categoryIds?.length) params.categoryIds = filter.categoryIds.join(',')
	if (filter.categoryName) params.categoryName = filter.categoryName
	// The default view stays out of the URL, so a shared link to an unfiltered table is still bare.
	const view = archivedViewOf(filter.isArchived)
	if (view !== 'active') params.archived = view
	return params
}

export function paramsToNameTextFilter(query: LocationQuery): NameTextFilter {
	return new NameTextFilter(firstQueryString(query.name) ?? null, firstQueryString(query.text) ?? null)
}

export function nameTextFilterToParams(filter: NameTextFilter): Record<string, string> {
	const params: Record<string, string> = {}
	if (filter.name) params.name = filter.name
	if (filter.text) params.text = filter.text
	return params
}

/**
 * The chips a multi-select combobox shows for an id list plus its free-text leftover: the ids are
 * resolved against the loaded options, anything unmatched is dropped, and the free text is appended
 * as a plain string the way VCombobox itself represents a typed-in value.
 */
export function buildCombobox(
	ids: number[] | null,
	freeText: string | null,
	options: SelectOption[],
): (SelectOption | string)[] {
	const result: (SelectOption | string)[] = []
	for (const id of ids ?? []) {
		const match = options.find(o => o.id === id)
		if (match) result.push(match)
	}
	if (freeText) result.push(freeText)
	return result
}

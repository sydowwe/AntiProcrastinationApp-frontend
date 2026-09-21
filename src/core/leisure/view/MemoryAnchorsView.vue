<template>
	<div class="py-4 h-100 w-100 d-flex flex-column ga-3">
		<div class="d-flex align-center ga-3">
			<h2 class="text-h6">{{ $t('leisure.memoryAnchors') }}</h2>
			<VBtnToggle
				v-model="viewMode"
				mandatory
				density="compact"
				variant="outlined"
				color="secondaryOutline"
			>
				<VBtn
					value="table"
					:title="$t('leisure.viewMode.table')"
				>
					<VIcon icon="list" />
				</VBtn>
				<VBtn
					value="timeline"
					:title="$t('leisure.viewMode.timeline')"
				>
					<VIcon icon="calendar-days" />
				</VBtn>
			</VBtnToggle>
			<FilterPanel
				v-model="filter"
				class="flex-1-1"
				:defaultFactory="() => new MemoryAnchorFilter()"
				:chipFormatters="chipFormatters"
			>
				<template #fields="{ draft }">
					<VTextField
						v-model="draft.activityName"
						:label="$t('leisure.fields.activity')"
						hideDetails
					/>
					<VNumberInput
						v-model="draft.anchorYear"
						:label="$t('leisure.fields.anchorYear')"
						:min="2000"
						:max="2200"
						clearable
						hideDetails
					/>
					<VNumberInput
						v-model="draft.anchorMonth"
						:label="$t('leisure.fields.anchorMonth')"
						:min="1"
						:max="12"
						clearable
						hideDetails
					/>
					<VNumberInput
						v-model="draft.minRating"
						:label="$t('leisure.fields.rating')"
						:min="1"
						:max="10"
						clearable
						hideDetails
					/>
				</template>
			</FilterPanel>
		</div>
		<div class="flex-fill">
			<MemoryAnchorTimeline
				v-if="viewMode === 'timeline'"
				:items="timelineItems"
				:loading="timelineLoading"
				:monthFilter="filter?.anchorMonth ?? null"
				:filtered="isTimelineFiltered"
				:failed="timelineFailed"
				v-model:year="timelineYear"
				@onReload="reloadTimeline"
				@onClearFilters="clearFilters"
			/>
			<MemoryAnchorTable
				v-else
				:items
				:loading
				:itemsLength
				:filtered="isFiltered"
				v-model:page="page"
				v-model:itemsPerPage="itemsPerPage"
				v-model:sortBy="sortBy"
				@onLoadItems="load"
				@onReload="reload"
				@onClearFilters="clearFilters"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { computed, ref, watch } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { useRoute, useRouter } from 'vue-router'
	import FilterPanel, { type ChipFormatters } from '@/_common/component/FilterPanel.vue'
	import MemoryAnchorTable from '@/core/leisure/component/memoryAnchor/MemoryAnchorTable.vue'
	import MemoryAnchorTimeline from '@/core/leisure/component/memoryAnchor/MemoryAnchorTimeline.vue'
	import { MemoryAnchorFilter } from '@/core/leisure/dto/request/MemoryAnchorFilter.ts'
	import { FilteredTableRequest } from '@/_common/dto/request/base/FilteredTableRequest.ts'
	import { isRequestCanceled } from '@/_common/axiosConfig.ts'
	import { useServerTable } from '@/_common/composable/table/useServerTable.ts'
	import { useMemoryAnchorCrud } from '@/core/leisure/api/memoryAnchorApi.ts'
	import type { MemoryAnchor } from '@/core/leisure/dto/response/MemoryAnchor.ts'
	import { memoryAnchorFilterUrlState } from '@/core/leisure/composable/leisureFilterUrlState.ts'
	import { useLeisureFilterChips } from '@/core/leisure/composable/useLeisureFilterChips.ts'

	const i18n = useI18n()
	const { textChip } = useLeisureFilterChips()

	const { fetchFilteredTable } = useMemoryAnchorCrud()
	// The view owns the table state because FilterPanel needs the same writable filter ref.
	const { items, itemsLength, loading, page, itemsPerPage, sortBy, filter, load, reload } = useServerTable<
		MemoryAnchor,
		MemoryAnchorFilter
	>({
		fetch: fetchFilteredTable,
		...memoryAnchorFilterUrlState(),
	})

	// The timeline groups by month rather than paging, and its year navigator has to know which years
	// hold anything at all — so it takes the whole (filtered) history in one response. Anchors are at
	// most a handful per month, so one oversized page is a simpler answer than a real pagination
	// scheme, matching how the bucket-list ladder and the project board already read.
	//
	// 200 is not a preference — it is the server's cap. `BaseFilterSortPaginateRequest` validates
	// `itemsPerPage` with "Must not exceed 200.", so the previous 500 made every timeline load answer
	// 400 and the view rendered the empty copy no matter what was in the database (F61). A user with
	// more than 200 anchors sees a truncated timeline rather than a 400; paging it is not this batch.
	// Raising it means raising the server's validator first.
	const TIMELINE_PAGE_SIZE = 200
	const route = useRoute()
	const router = useRouter()
	const viewMode = ref<'table' | 'timeline'>(route.query.view === 'timeline' ? 'timeline' : 'table')
	const timelineItems = ref<MemoryAnchor[]>([])
	const timelineLoading = ref(false)
	// A rejected load must not render as "you have none" — the timeline shows its error branch instead
	// and keeps whatever it had. A cancellation (a newer load superseded this one) is not a failure.
	const timelineFailed = ref(false)

	// Its own crud instance, on purpose: `useFetchFilteredTable` aborts its previous request, so sharing
	// the table's instance would have the two modes cancel each other.
	const { fetchFilteredTable: fetchTimeline } = useMemoryAnchorCrud()

	async function loadTimeline() {
		timelineLoading.value = true
		try {
			// `anchorYear` and `anchorMonth` are stripped from the request: the timeline navigates years
			// itself and narrows months client-side, so sending them would leave it with only one month
			// to draw. These are the wire field names — the URL keys are still `year`/`month`.
			const timelineFilter = Object.assign(new MemoryAnchorFilter(), filter.value, {
				anchorYear: null,
				anchorMonth: null,
			})
			const request = new FilteredTableRequest<MemoryAnchorFilter>(
				TIMELINE_PAGE_SIZE,
				1,
				[],
				true,
				timelineFilter,
			)
			const result = await fetchTimeline(request)
			timelineItems.value = result.items
			timelineFailed.value = false
		} catch (error) {
			if (isRequestCanceled(error)) return
			timelineFailed.value = true
		} finally {
			timelineLoading.value = false
		}
	}

	function reloadTimeline() {
		void loadTimeline()
	}

	const isFiltered = computed(() => filter.value?.hasAny() ?? false)
	// The timeline's rows only answer to the fields it sends — year and month are navigated and
	// narrowed client-side (see `loadTimeline`), so a chosen year with nothing in it is still the
	// genuinely-empty case, not a "nothing matches" one.
	const isTimelineFiltered = computed(() => !!filter.value?.activityName || filter.value?.minRating != null)

	function clearFilters() {
		filter.value = new MemoryAnchorFilter()
	}

	// The year navigator writes the filter's own `anchorYear`, so it is bookmarkable through the existing
	// `?year=` URL param, its chip honestly describes what is on screen, and switching back to the table
	// lands on the same year. Reassigned rather than mutated so `hasAny()` survives on a real
	// MemoryAnchorFilter.
	const timelineYear = computed<number | null>({
		get: () => filter.value?.anchorYear ?? null,
		set: value => {
			filter.value = Object.assign(new MemoryAnchorFilter(), filter.value, { anchorYear: value })
		},
	})

	watch(viewMode, value => router.replace({ query: { ...route.query, view: value } }))
	// Deliberately not a deep watch on `filter`: only the fields the timeline actually sends can change
	// its response, so paging through years must not cost a refetch.
	watch(
		[viewMode, () => filter.value?.activityName, () => filter.value?.minRating],
		() => {
			if (viewMode.value === 'timeline') void loadTimeline()
		},
		{ immediate: true },
	)

	const chipFormatters: ChipFormatters<MemoryAnchorFilter> = {
		activityName: textChip('leisure.fields.activity', 'magnifying-glass'),
		anchorYear: textChip('leisure.fields.anchorYear', 'calendar'),
		anchorMonth: textChip('leisure.fields.anchorMonth', 'calendar-days'),
		minRating: v => (v != null ? { label: `${i18n.t('leisure.fields.rating')} ≥ ${v}`, icon: 'star' } : null),
	}
</script>

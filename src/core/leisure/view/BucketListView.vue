<template>
	<div class="py-4 h-100 w-100 d-flex flex-column ga-3">
		<div class="d-flex align-center ga-3">
			<h2 class="text-h6">{{ $t('leisure.bucketList') }}</h2>
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
					value="ladder"
					:title="$t('leisure.viewMode.ladder')"
				>
					<VIcon icon="stairs" />
				</VBtn>
			</VBtnToggle>
			<FilterPanel
				v-model="filter"
				class="flex-1-1"
				:defaultFactory="() => new ActivityBucketListProfileFilter()"
				:chipFormatters="chipFormatters"
			>
				<template #fields="{ draft }">
					<VTextField
						v-model="draft.activityName"
						:label="$t('leisure.fields.activity')"
						hideDetails
					/>
					<VIdSelect
						v-model="draft.experienceTypeIds"
						:label="$t('leisure.fields.experienceType')"
						:items="experienceTypeOptions"
						multiple
						chips
						density="compact"
						hideDetails
					/>
					<VNumberInput
						v-model="draft.minComfortZoneStep"
						:label="`${$t('leisure.fields.comfortZoneStep')} (min)`"
						:min="0"
						clearable
						hideDetails
					/>
					<VNumberInput
						v-model="draft.maxComfortZoneStep"
						:label="`${$t('leisure.fields.comfortZoneStep')} (max)`"
						:min="0"
						clearable
						hideDetails
					/>
					<NullFalseTrueCheckbox
						v-model="draft.requiresTravel"
						:label="$t('leisure.fields.requiresTravel')"
						hideDetails
					/>
					<NullFalseTrueCheckbox
						v-model="draft.isAnchored"
						:label="$t('leisure.fields.experienced')"
						hideDetails
					/>
				</template>
			</FilterPanel>
		</div>
		<ExperiencedProgress
			:done="experiencedDone"
			:total="experiencedTotal"
			:visible="experiencedVisible"
		/>
		<div class="flex-fill">
			<BucketListLadder
				v-if="viewMode === 'ladder'"
				:items="ladderItems"
				:loading="ladderLoading"
				@onReload="reloadLadder"
			/>
			<BucketListTable
				v-else
				:items
				:loading
				:itemsLength
				v-model:page="page"
				v-model:itemsPerPage="itemsPerPage"
				v-model:sortBy="sortBy"
				@onLoadItems="load"
				@onReload="reloadAll"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { computed, onMounted, ref, watch } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { useRoute, useRouter } from 'vue-router'
	import FilterPanel, { type ChipFormatters } from '@/_common/component/FilterPanel.vue'
	import BucketListTable from '@/core/leisure/component/bucketList/BucketListTable.vue'
	import BucketListLadder from '@/core/leisure/component/bucketList/BucketListLadder.vue'
	import ExperiencedProgress from '@/core/leisure/component/ExperiencedProgress.vue'
	import NullFalseTrueCheckbox from '@/_common/component/inputs/NullFalseTrueCheckbox.vue'
	import { ActivityBucketListProfileFilter } from '@/core/leisure/dto/request/ActivityBucketListProfileFilter.ts'
	import type { LookupResponse } from '@/_common/dto/response/general/LookupResponse.ts'
	import { useActivityExperienceTypeApi } from '@/core/leisure/api/activityLookupApi.ts'
	import { useServerTable } from '@/_common/composable/table/useServerTable.ts'
	import { useActivityBucketListProfileCrud } from '@/core/leisure/api/activityBucketListProfileApi.ts'
	import type { ActivityBucketListProfile } from '@/core/leisure/dto/response/ActivityBucketListProfile.ts'
	import { FilteredTableRequest } from '@/_common/dto/request/base/FilteredTableRequest.ts'
	import { bucketListFilterUrlState } from '@/core/leisure/composable/leisureFilterUrlState.ts'
	import { useLeisureFilterChips } from '@/core/leisure/composable/useLeisureFilterChips.ts'
	import { useExperiencedProgress } from '@/core/leisure/composable/useExperiencedProgress.ts'

	const i18n = useI18n()
	const { textChip, countChip, boolChip } = useLeisureFilterChips()

	const { fetchFilteredTable } = useActivityBucketListProfileCrud()
	// The view owns the table state because FilterPanel needs the same writable filter ref.
	const { items, itemsLength, loading, page, itemsPerPage, sortBy, filter, load, reload } = useServerTable<
		ActivityBucketListProfile,
		ActivityBucketListProfileFilter
	>({
		fetch: fetchFilteredTable,
		...bucketListFilterUrlState(),
	})

	const { fetchAll: fetchExperienceTypes } = useActivityExperienceTypeApi()
	const experienceTypeOptions = ref<LookupResponse[]>([])

	onMounted(async () => {
		experienceTypeOptions.value = await fetchExperienceTypes()
	})

	// The ladder groups by rung rather than paging, so it needs every filtered row at once. A bucket
	// list is small; a five-figure page size is a generous, simple cap rather than a real pagination scheme.
	const LADDER_PAGE_SIZE = 500
	const route = useRoute()
	const router = useRouter()
	const viewMode = ref<'table' | 'ladder'>(route.query.view === 'ladder' ? 'ladder' : 'table')
	const ladderItems = ref<ActivityBucketListProfile[]>([])
	const ladderLoading = ref(false)

	async function loadLadder() {
		ladderLoading.value = true
		try {
			const request = new FilteredTableRequest<ActivityBucketListProfileFilter>(
				LADDER_PAGE_SIZE,
				1,
				[],
				true,
				filter.value ?? new ActivityBucketListProfileFilter(),
			)
			const result = await fetchFilteredTable(request)
			ladderItems.value = result.items
		} finally {
			ladderLoading.value = false
		}
	}

	// Declared after the ladder state on purpose: the composable reads `items` immediately, so a
	// computed closing over `ladderItems` has to be built once that ref exists.
	//
	// Its own crud instance, also on purpose: `useFetchFilteredTable` aborts its previous request, so
	// sharing the table's instance would have the counts cancel the table's own fetch.
	const { fetchFilteredTable: fetchCount } = useActivityBucketListProfileCrud()
	const visibleRows = computed(() => (viewMode.value === 'ladder' ? ladderItems.value : items.value))
	const {
		done: experiencedDone,
		total: experiencedTotal,
		visible: experiencedVisible,
		recount,
	} = useExperiencedProgress({
		fetch: fetchCount,
		filter,
		items: visibleRows,
		cloneFilter: base => Object.assign(new ActivityBucketListProfileFilter(), base),
	})

	// Every reload is a change to the set the fraction is over — a new anchor, a new entry, a deleted
	// one. The filter has not moved, so nothing else would trigger the recount.
	function reloadAll() {
		reload()
		recount()
	}

	function reloadLadder() {
		void loadLadder()
		recount()
	}

	watch(viewMode, value => router.replace({ query: { ...route.query, view: value } }))
	watch(
		[viewMode, filter],
		() => {
			if (viewMode.value === 'ladder') void loadLadder()
		},
		{ deep: true, immediate: true },
	)

	const chipFormatters: ChipFormatters<ActivityBucketListProfileFilter> = {
		activityName: textChip('leisure.fields.activity', 'magnifying-glass'),
		experienceTypeIds: countChip('leisure.fields.experienceType', 'star'),
		minComfortZoneStep: (_, f) =>
			f.minComfortZoneStep != null || f.maxComfortZoneStep != null
				? {
						label: `${i18n.t('leisure.fields.comfortZoneStep')}: ${f.minComfortZoneStep ?? '…'} – ${f.maxComfortZoneStep ?? '…'}`,
						icon: 'person-walking',
						resetKeys: ['minComfortZoneStep', 'maxComfortZoneStep'],
					}
				: null,
		maxComfortZoneStep: () => null,
		requiresTravel: boolChip('leisure.fields.requiresTravel', 'plane'),
		isAnchored: boolChip('leisure.fields.experienced', 'circle-check'),
	}
</script>

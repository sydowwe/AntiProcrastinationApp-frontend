<template>
	<div class="py-4 h-100 w-100 d-flex flex-column ga-3">
		<div class="d-flex align-center ga-3">
			<h2 class="text-h6">{{ $t('leisure.bucketList') }}</h2>
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
				</template>
			</FilterPanel>
		</div>
		<div class="flex-fill">
			<BucketListTable
				:items
				:loading
				:itemsLength
				v-model:page="page"
				v-model:itemsPerPage="itemsPerPage"
				v-model:sortBy="sortBy"
				@onLoadItems="load"
				@onReload="reload"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { onMounted, ref } from 'vue'
	import { useI18n } from 'vue-i18n'
	import FilterPanel, { type ChipFormatters } from '@/_common/component/FilterPanel.vue'
	import BucketListTable from '@/core/leisure/component/bucketList/BucketListTable.vue'
	import NullFalseTrueCheckbox from '@/_common/component/inputs/NullFalseTrueCheckbox.vue'
	import { ActivityBucketListProfileFilter } from '@/core/leisure/dto/request/ActivityBucketListProfileFilter.ts'
	import type { LookupResponse } from '@/_common/dto/response/general/LookupResponse.ts'
	import { useActivityExperienceTypeApi } from '@/core/leisure/api/activityLookupApi.ts'
	import { useServerTable } from '@/_common/composable/table/useServerTable.ts'
	import { useActivityBucketListProfileCrud } from '@/core/leisure/api/activityBucketListProfileApi.ts'
	import type { ActivityBucketListProfile } from '@/core/leisure/dto/response/ActivityBucketListProfile.ts'
	import { bucketListFilterUrlState } from '@/core/leisure/composable/leisureFilterUrlState.ts'
	import { useLeisureFilterChips } from '@/core/leisure/composable/useLeisureFilterChips.ts'

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
	}
</script>

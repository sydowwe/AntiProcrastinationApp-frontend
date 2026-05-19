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
					<VSelect
						v-model="draft.experienceTypes as ExperienceType[] | null"
						:label="$t('leisure.fields.experienceType')"
						:items="experienceOptions"
						itemValue="value"
						itemTitle="title"
						multiple
						chips
						clearable
						variant="outlined"
						density="compact"
						hideDetails
					/>
					<VNumberInput
						v-model="draft.minComfortZoneStep as number | null"
						:label="`${$t('leisure.fields.comfortZoneStep')} (min)`"
						:min="0"
						clearable
						hideDetails
					/>
					<VNumberInput
						v-model="draft.maxComfortZoneStep as number | null"
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
			<BucketListTable :filter />
		</div>
	</div>
</template>

<script setup lang="ts">
	import { ref } from 'vue'
	import { useI18n } from 'vue-i18n'
	import FilterPanel, { type ChipFormatters } from '@/components/general/FilterPanel.vue'
	import BucketListTable from '@/components/leisure/bucketList/BucketListTable.vue'
	import NullFalseTrueCheckbox from '@/components/general/inputs/NullFalseTrueCheckbox.vue'
	import { ActivityBucketListProfileFilter } from '@/dtos/request/leisure/ActivityBucketListProfileFilter.ts'
	import { ExperienceType } from '@/dtos/enum/ExperienceType.ts'
	import { getEnumSelectOptions } from '@/composables/general/EnumComposable.ts'

	const i18n = useI18n()
	const filter = ref(new ActivityBucketListProfileFilter())

	const experienceOptions = getEnumSelectOptions(ExperienceType, 'enums.experienceType')

	const chipFormatters: ChipFormatters<ActivityBucketListProfileFilter> = {
		activityName: v =>
			v ? { label: `${i18n.t('leisure.fields.activity')}: ${v}`, icon: 'magnifying-glass' } : null,
		experienceTypes: v =>
			v?.length ? { label: `${i18n.t('leisure.fields.experienceType')} (${v.length})`, icon: 'star' } : null,
		minComfortZoneStep: (_, f) =>
			f.minComfortZoneStep != null || f.maxComfortZoneStep != null
				? {
						label: `${i18n.t('leisure.fields.comfortZoneStep')}: ${f.minComfortZoneStep ?? '…'} – ${f.maxComfortZoneStep ?? '…'}`,
						icon: 'person-walking',
						resetKeys: ['minComfortZoneStep', 'maxComfortZoneStep'],
					}
				: null,
		maxComfortZoneStep: () => null,
		requiresTravel: v => {
			if (v == null) return null
			return {
				label: `${i18n.t('leisure.fields.requiresTravel')}: ${v ? '✓' : '✗'}`,
				icon: 'plane',
			}
		},
	}
</script>

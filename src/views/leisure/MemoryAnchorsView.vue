<template>
	<div class="py-4 h-100 w-100 d-flex flex-column ga-3">
		<div class="d-flex align-center ga-3">
			<h2 class="text-h6">{{ $t('leisure.memoryAnchors') }}</h2>
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
						v-model="draft.year as number | null"
						:label="$t('leisure.fields.anchorYear')"
						:min="2000"
						:max="2200"
						clearable
						hideDetails
					/>
					<VNumberInput
						v-model="draft.month as number | null"
						:label="$t('leisure.fields.anchorMonth')"
						:min="1"
						:max="12"
						clearable
						hideDetails
					/>
					<VNumberInput
						v-model="draft.minRating as number | null"
						:label="$t('leisure.fields.rating')"
						:min="1"
						:max="5"
						clearable
						hideDetails
					/>
				</template>
			</FilterPanel>
		</div>
		<div class="flex-fill">
			<MemoryAnchorTable :filter />
		</div>
	</div>
</template>

<script setup lang="ts">
	import { ref } from 'vue'
	import { useI18n } from 'vue-i18n'
	import FilterPanel, { type ChipFormatters } from '@/components/general/FilterPanel.vue'
	import MemoryAnchorTable from '@/components/leisure/memoryAnchor/MemoryAnchorTable.vue'
	import { MemoryAnchorFilter } from '@/dtos/request/leisure/MemoryAnchorFilter.ts'

	const i18n = useI18n()
	const filter = ref(new MemoryAnchorFilter())

	const chipFormatters: ChipFormatters<MemoryAnchorFilter> = {
		activityName: v =>
			v ? { label: `${i18n.t('leisure.fields.activity')}: ${v}`, icon: 'magnifying-glass' } : null,
		year: v =>
			v != null ? { label: `${i18n.t('leisure.fields.anchorYear')}: ${v}`, icon: 'calendar' } : null,
		month: v =>
			v != null ? { label: `${i18n.t('leisure.fields.anchorMonth')}: ${v}`, icon: 'calendar-days' } : null,
		minRating: v =>
			v != null ? { label: `${i18n.t('leisure.fields.rating')} ≥ ${v}`, icon: 'star' } : null,
	}
</script>

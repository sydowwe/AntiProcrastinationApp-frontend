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
						v-model="draft.year"
						:label="$t('leisure.fields.anchorYear')"
						:min="2000"
						:max="2200"
						clearable
						hideDetails
					/>
					<VNumberInput
						v-model="draft.month"
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
			<MemoryAnchorTable
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
	import { useI18n } from 'vue-i18n'
	import FilterPanel, { type ChipFormatters } from '@/_common/component/FilterPanel.vue'
	import MemoryAnchorTable from '@/core/leisure/component/memoryAnchor/MemoryAnchorTable.vue'
	import { MemoryAnchorFilter } from '@/core/leisure/dto/request/MemoryAnchorFilter.ts'
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

	const chipFormatters: ChipFormatters<MemoryAnchorFilter> = {
		activityName: textChip('leisure.fields.activity', 'magnifying-glass'),
		year: textChip('leisure.fields.anchorYear', 'calendar'),
		month: textChip('leisure.fields.anchorMonth', 'calendar-days'),
		minRating: v => (v != null ? { label: `${i18n.t('leisure.fields.rating')} ≥ ${v}`, icon: 'star' } : null),
	}
</script>

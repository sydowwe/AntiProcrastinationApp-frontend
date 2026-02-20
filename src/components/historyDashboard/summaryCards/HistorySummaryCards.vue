<template>
<div class="history-summary-cards">
	<!-- Header -->
	<div class="d-flex ga-4 align-center mb-4 flex-wrap">
		<h2 class="text-h5">Top {{ groupByLabel }}</h2>
		<VSelect
			label="Compared to"
			:modelValue="selectedBaseline"
			:items="baselineOptions"
			density="compact"
			variant="outlined"
			hideDetails
			@update:modelValue="emit('update:selectedBaseline', $event)"
			style="min-width: 170px; max-width: 170px;"
		/>
		<VSelect
			label="Show"
			:modelValue="topN"
			:items="topNOptions"
			density="compact"
			variant="outlined"
			hideDetails
			@update:modelValue="emit('update:topN', $event)"
			style="min-width: 100px; max-width: 100px;"
		/>
		<HistoryPeriodBanner :comparison="data?.periodComparison ?? null"/>
	</div>
	<VDivider class="mb-4"/>

	<!-- Loading State -->
	<div v-if="loading" class="cards-scroll" :class="scrollClass">
		<div class="cards-row" :style="{'--cards-per-row': cardsPerRow}">
			<VSkeletonLoader v-for="i in topN" :key="i" type="card" class="summary-card-slot"/>
		</div>
	</div>

	<!-- Empty State -->
	<div v-else-if="!data || data.cards.length === 0" class="empty-state">
		<VIcon icon="fas fa-chart-column" size="64" class="text-disabled mb-4"/>
		<p class="text-body-1 text-medium-emphasis">No data for this period</p>
	</div>

	<!-- Cards -->
	<div v-else class="cards-scroll" :class="scrollClass">
		<div class="cards-row" :style="{'--cards-per-row': cardsPerRow}">
			<HistorySummaryCard
				v-for="card in data.cards"
				:key="card.name"
				class="summary-card-slot"
				:card="card"
				:selected="card.name === selectedGroup"
				@click="handleCardClick"
			/>
		</div>
	</div>
</div>
</template>

<script setup lang="ts">
import {computed} from 'vue'
import {useDisplay} from 'vuetify'
import {BaselineOption, BaselineType} from '@/components/activityTracking/summaryCards/BaselineOption.ts'
import type {HistorySummaryCardsResponse} from '@/dtos/response/historyDashboard/HistorySummaryCardsResponse.ts'
import type {HistoryGroupBy} from '@/components/historyDashboard/types/HistoryGroupBy.ts'
import HistorySummaryCard from './HistorySummaryCard.vue'
import HistoryPeriodBanner from './HistoryPeriodBanner.vue'

const props = defineProps<{
	data: HistorySummaryCardsResponse | null
	groupBy: HistoryGroupBy
	selectedGroup: string | null
	selectedBaseline: BaselineType
	topN: number
	loading?: boolean
}>()

const emit = defineEmits<{
	'update:selectedBaseline': [value: BaselineType]
	'update:topN': [value: number]
	groupClick: [name: string]
}>()

const {lgAndUp, xlAndUp} = useDisplay()

const baselineOptions: BaselineOption[] = [
	new BaselineOption(BaselineType.Last7Days, 'Last 7 days'),
	new BaselineOption(BaselineType.Last30Days, 'Last 30 days'),
	new BaselineOption(BaselineType.SameWeekday, 'Same weekday'),
	new BaselineOption(BaselineType.AllTime, 'All time'),
]

const topNOptions = [
	{title: '3', value: 3},
	{title: '4', value: 4},
	{title: '5', value: 5},
	{title: '8', value: 8},
	{title: '10', value: 10},
]

const visibleRows = computed(() => {
	// lg: 1 visible row, md and xl+: 2 visible rows
	if (lgAndUp.value && !xlAndUp.value) return 1
	return 2
})

// Grid always splits cards into 2 rows worth of columns
const cardsPerRow = computed(() => Math.ceil(props.topN / 2))

const scrollClass = computed(() => visibleRows.value === 1 ? 'scroll-1-row' : 'scroll-2-rows')

const groupByLabel = computed(() => {
	switch (props.groupBy) {
		case 'ACTIVITY':
			return 'Activities'
		case 'ROLE':
			return 'Roles'
		case 'CATEGORY':
			return 'Categories'
	}
})

function handleCardClick(name: string) {
	emit('groupClick', name)
}
</script>

<style scoped>
.history-summary-cards {
	width: 100%;
}

.cards-scroll {
	overflow-y: auto;
	scroll-snap-type: y mandatory;
}

.scroll-1-row {
	max-height: calc(1 * 160px);
}

.scroll-2-rows {
	max-height: calc(2 * 160px + 1 * 16px);
}

.cards-row {
	display: grid;
	grid-template-columns: repeat(var(--cards-per-row), auto);
	gap: 16px;
	justify-content: start;
}

/* Each grid row snaps into view */
.cards-row > :deep(*) {
	scroll-snap-align: start;
}

.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 48px 16px;
	text-align: center;
}
</style>

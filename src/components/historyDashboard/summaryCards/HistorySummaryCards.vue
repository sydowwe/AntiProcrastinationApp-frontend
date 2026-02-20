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
			hideDetails
			@update:modelValue="emit('update:selectedBaseline', $event)"
			style="min-width: 170px; max-width: 170px;"
		/>
		<VSelect
			label="Show"
			:modelValue="topN"
			:items="topNOptions"
			density="compact"
			hideDetails
			@update:modelValue="emit('update:topN', $event)"
			style="min-width: 100px; max-width: 100px;"
		/>
		<HistoryPeriodBanner :comparison="data?.periodComparison ?? null"/>
	</div>
	<VDivider class="mb-4"/>

	<!-- Loading State -->
	<div v-if="loading" class="cards-scroll" :class="scrollClass">
		<div class="cards-grid" :style="{'--cols': cols}">
			<VSkeletonLoader v-for="i in topN" :key="i" type="card" class="skeleton-card"/>
		</div>
	</div>

	<!-- Empty State -->
	<div v-else-if="!data || data.cards.length === 0" class="empty-state">
		<VIcon icon="fas fa-chart-column" size="64" class="text-disabled mb-4"/>
		<p class="text-body-1 text-medium-emphasis">No data for this period</p>
	</div>

	<!-- Cards -->
	<div v-else ref="scrollRef" class="cards-scroll" :class="scrollClass">
		<div ref="gridRef" class="cards-grid" :style="{'--cols': cols}">
			<HistorySummaryCard
				v-for="card in data.cards"
				:key="card.name"
				:card="card"
				:selected="card.name === selectedGroup"
				@click="handleCardClick"
			/>
		</div>
	</div>
</div>
</template>

<script setup lang="ts">
import {computed, nextTick, ref, watch} from 'vue'
import {useDisplay} from 'vuetify'
import {useResizeObserver} from '@vueuse/core'
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

const scrollRef = ref<HTMLElement>()
const gridRef = ref<HTMLElement>()
const containerWidth = ref(1000)
const cols = ref(4)

useResizeObserver(scrollRef, (entries) => {
	containerWidth.value = entries[0]?.contentRect.width ?? 1000
	recalcCols()
})

// Generate candidates: topN (1 row), ceil(topN/2), ceil(topN/3), ... down to 1
function getCandidates(n: number): number[] {
	const candidates: number[] = []
	for (let rows = 1; rows <= n; rows++) {
		const perRow = Math.ceil(n / rows)
		if (candidates.length === 0 || candidates[candidates.length - 1] !== perRow) {
			candidates.push(perRow)
		}
	}
	return candidates
}

function recalcCols() {
	if (!gridRef.value || !scrollRef.value) return

	const gap = 16
	const available = containerWidth.value
	const candidates = getCandidates(props.topN)

	// Temporarily set grid to all cards in one row to measure each card's natural width
	const prevCols = cols.value
	cols.value = props.topN
	// We can't measure synchronously after reactive change, so use the children's scrollWidth
	// Instead, measure children's min-content widths directly
	const children = Array.from(gridRef.value.children) as HTMLElement[]
	const widths = children.map(c => c.scrollWidth)

	// For each candidate, check if the widest cards in each column fit
	for (const candidate of candidates) {
		// For this candidate, column i gets cards at indices i, i+candidate, i+2*candidate, ...
		let totalWidth = 0
		for (let col = 0; col < candidate; col++) {
			let maxW = 0
			for (let idx = col; idx < widths.length; idx += candidate) {
				maxW = Math.max(maxW, widths[idx] ?? 0)
			}
			totalWidth += maxW
		}
		totalWidth += (candidate - 1) * gap
		if (totalWidth <= available) {
			cols.value = candidate
			return
		}
	}
	// Fallback: 1 per row
	cols.value = 1
}

watch([() => props.topN, () => props.data], () => {
	nextTick(() => recalcCols())
})

const visibleRows = computed(() => {
	if (lgAndUp.value && !xlAndUp.value) return 1
	return 2
})

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

// Snap scroll to top when data changes
watch(() => props.data, () => {
	nextTick(() => {
		if (scrollRef.value) scrollRef.value.scrollTop = 0
	})
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

.cards-grid {
	display: grid;
	grid-template-columns: repeat(var(--cols), auto);
	gap: 16px;
	justify-content: start;
}

/* Each grid row snaps into view */
.cards-grid > :deep(*) {
	scroll-snap-align: start;
}

.skeleton-card {
	min-width: 160px;
	height: 160px;
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

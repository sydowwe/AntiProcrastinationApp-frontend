<template>
	<div class="pie-chart-section">
		<template v-if="loading">
			<div class="d-flex ga-4">
				<div class="flex-1-1">
					<VSkeletonLoader type="image, list-item@3" />
				</div>
				<div class="flex-1-1">
					<VSkeletonLoader type="card" />
				</div>
			</div>
		</template>

		<template v-else-if="!domains || domains.length === 0">
			<VCard variant="outlined" class="pa-8 text-center">
				<div class="text-h6 text-medium-emphasis">
					No activity recorded for this period
				</div>
			</VCard>
		</template>

		<template v-else>
			<div class="content-grid">
				<div class="chart-column">
					<ActivityPieChart
						:domains="pieSegments"
						:viewMode="viewMode"
						:selectedDomain="selectedDomain"
						@update:viewMode="viewMode = $event"
						@segmentClick="onSegmentClick"
					/>
				</div>

				<div class="details-column">
					<ActivityDetailsPanel
						:mode="detailsMode"
						:dayTotals="dayTotals"
						:domainDetails="selectedDomainDetails"
						@close="onDetailsClose"
					/>
				</div>
			</div>
		</template>
	</div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import ActivityPieChart from './ActivityPieChart.vue'
import ActivityDetailsPanel from './ActivityDetailsPanel.vue'
import { getDomainColor } from '@/utils/domainColor'

interface PageVisit {
	url: string
	seconds: number
}

interface DomainPieData {
	domain: string
	activeSeconds: number
	backgroundSeconds: number
	totalSeconds: number
	pages: PageVisit[]
	entries?: number
}

interface DayTotals {
	totalSeconds: number
	activeSeconds: number
	backgroundSeconds: number
	totalDomains: number
	totalPages: number
	totalVisits?: number
}

interface PieSegment {
	domain: string
	seconds: number
	percent: number
	color: string
}

const props = defineProps<{
	domains: DomainPieData[]
	dayTotals: DayTotals
	loading?: boolean
	otherThresholdPercent?: number
}>()

const emit = defineEmits<{
	(e: 'domainSelect', domain: string | null): void
}>()

const viewMode = ref<'total' | 'active' | 'background'>('total')
const selectedDomain = ref<string | null>(null)

const pieSegments = computed<PieSegment[]>(() => {
	const metric = viewMode.value

	let data = props.domains
		.map((d) => ({
			domain: d.domain,
			seconds:
				metric === 'total'
					? d.totalSeconds
					: metric === 'active'
						? d.activeSeconds
						: d.backgroundSeconds,
			color: getDomainColor(d.domain),
		}))
		.filter((d) => d.seconds > 0)

	const total = data.reduce((sum, d) => sum + d.seconds, 0)

	if (total === 0) return []

	// Calculate percentages and group small ones into "Other"
	const threshold = props.otherThresholdPercent ?? 3
	const significant: PieSegment[] = []
	let otherSeconds = 0

	for (const d of data) {
		const percent = (d.seconds / total) * 100
		if (percent >= threshold) {
			significant.push({ ...d, percent })
		} else {
			otherSeconds += d.seconds
		}
	}

	if (otherSeconds > 0) {
		significant.push({
			domain: '_other',
			seconds: otherSeconds,
			percent: (otherSeconds / total) * 100,
			color: '#9e9e9e',
		})
	}

	return significant.sort((a, b) => b.seconds - a.seconds)
})

const selectedDomainDetails = computed(() => {
	if (!selectedDomain.value) return null

	const domain = props.domains.find((d) => d.domain === selectedDomain.value)
	if (!domain) return null

	return {
		domain: domain.domain,
		totalSeconds: domain.totalSeconds,
		activeSeconds: domain.activeSeconds,
		backgroundSeconds: domain.backgroundSeconds,
		entries: domain.entries ?? 0,
		pages: domain.pages ?? [],
	}
})

const detailsMode = computed(() => (selectedDomain.value ? 'domain' : 'dayTotal'))

function onSegmentClick(domain: string | null) {
	selectedDomain.value = domain
	emit('domainSelect', domain)
}

function onDetailsClose() {
	selectedDomain.value = null
	emit('domainSelect', null)
}
</script>

<style scoped>
.pie-chart-section {
	width: 100%;
}

.content-grid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 24px;
	align-items: start;
}

.chart-column,
.details-column {
	min-width: 0;
}

@media (max-width: 960px) {
	.content-grid {
		grid-template-columns: 1fr;
	}
}
</style>

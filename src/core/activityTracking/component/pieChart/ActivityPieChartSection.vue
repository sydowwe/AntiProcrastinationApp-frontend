<template>
	<VCard class="pa-5">
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

		<template v-else-if="error">
			<VCard
				variant="outlined"
				class="h-100 pa-8 d-flex flex-column align-center justify-center"
			>
				<VIcon
					icon="fas fa-triangle-exclamation"
					size="48"
					class="text-disabled mb-2"
				/>
				<p class="text-body-2 text-medium-emphasis mb-3">{{ $t('activityTracking.common.loadFailed') }}</p>
				<VBtn
					size="small"
					variant="outlined"
					@click="emit('retry')"
				>
					{{ $t('activityTracking.common.retry') }}
				</VBtn>
			</VCard>
		</template>

		<template v-else-if="!domains || domains.length === 0">
			<VCard
				variant="outlined"
				class="h-100"
			>
				<ActivityEmptyState
					:probeState="emptyProbeState"
					:isRangeMode
					@widenWindow="emit('widenWindow')"
				/>
			</VCard>
		</template>

		<template v-else>
			<div class="d-flex ga-2">
				<div class="chart-column">
					<ActivityPieChart
						v-model="viewMode"
						:domains="pieSegments"
						:selectedDomain="selectedDomain"
						@segmentClick="onSegmentClick"
					/>
				</div>

				<ActivityDetailsPanel
					class="flex-fill"
					:mode="detailsMode"
					:dayTotals="dayTotals"
					:isRangeMode
					:domainDetails="selectedDomainDetails"
					@close="onDetailsClose"
				/>
			</div>
		</template>
	</VCard>
</template>

<script setup lang="ts">
	import { computed, ref } from 'vue'
	import ActivityPieChart from './ActivityPieChart.vue'
	import ActivityDetailsPanel from './ActivityDetailsPanel.vue'
	import ActivityEmptyState from '@/core/activityTracking/component/ActivityEmptyState.vue'
	import { getDomainColor } from '@/_common/utils/domainColor.ts'
	import type { PieSegment } from './PieSegment.ts'
	import type { DomainPieData } from '@/core/activityTracking/dto/response/pieChart/DomainPieData.ts'
	import type { DayTotals } from '@/core/activityTracking/dto/response/pieChart/DayTotals.ts'
	import type { ActivityEmptyProbeState } from '@/core/activityTracking/composable/useActivityDashboard.ts'

	const props = defineProps<{
		domains: DomainPieData[]
		dayTotals?: DayTotals
		loading?: boolean
		error?: boolean
		otherThresholdPercent?: number
		emptyProbeState?: ActivityEmptyProbeState
		isRangeMode?: boolean
	}>()

	const emit = defineEmits<{
		(e: 'domainSelect', domain: string | null): void

		(e: 'retry'): void

		(e: 'widenWindow'): void
	}>()

	const selectedDomain = defineModel<string | null>('selectedDomain', { default: null })
	const viewMode = ref<'total' | 'active' | 'background'>('total')
	const pieSegments = computed<PieSegment[]>(() => {
		const metric = viewMode.value

		const data = props.domains
			.map(d => ({
				domain: d.domain,
				seconds:
					metric === 'total' ? d.totalSeconds : metric === 'active' ? d.activeSeconds : d.backgroundSeconds,
				color: getDomainColor(d.domain),
			}))
			.filter(d => d.seconds > 0)

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

		const domain = props.domains.find(d => d.domain === selectedDomain.value)
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

<style scoped></style>

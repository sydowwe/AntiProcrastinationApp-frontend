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

		<template v-else-if="!apps || apps.length === 0">
			<VCard
				variant="outlined"
				class="pa-8 text-center"
			>
				<div class="text-h6 text-medium-emphasis">No activity recorded for this period</div>
			</VCard>
		</template>

		<template v-else>
			<div class="d-flex ga-2">
				<div class="chart-column">
					<ActivityPieChart
						v-model="viewMode"
						:domains="pieSegments"
						:selectedDomain="selectedAppLabel ?? ''"
						@segmentClick="onSegmentClick"
					/>
				</div>

				<div class="flex-fill">
					<VCard
						variant="outlined"
						class="pa-4"
					>
						<div class="details-grid">
							<div class="detail-row">
								<span class="text-medium-emphasis">Total time:</span>
								<span class="font-weight-medium">{{ formatDuration(totals?.totalSeconds ?? 0) }}</span>
							</div>
							<VDivider class="my-2" />
							<div class="detail-row">
								<span class="text-medium-emphasis">Apps:</span>
								<span>{{ totals?.totalApps ?? 0 }}</span>
							</div>
							<div class="detail-row">
								<span class="text-medium-emphasis">Sessions:</span>
								<span>{{ totals?.totalSessions ?? 0 }}</span>
							</div>
						</div>
					</VCard>
				</div>
			</div>
		</template>
	</VCard>
</template>

<script setup lang="ts">
	import { computed, ref } from 'vue'
	import ActivityPieChart from '@/components/activityTracking/pieChart/ActivityPieChart.vue'
	import { getDomainColor } from '@/utils/domainColor'
	import type { PieSegment } from '@/components/activityTracking/pieChart/PieSegment.ts'
	import { formatDuration } from '@/utils/formatDuration'
	import type { AndroidAppPieData } from '@/dtos/response/activityTracking/android/AndroidAppPieData.ts'
	import type { AndroidPieTotals } from '@/dtos/response/activityTracking/android/AndroidPieTotals.ts'

	const props = defineProps<{
		apps: AndroidAppPieData[]
		totals?: AndroidPieTotals
		loading?: boolean
	}>()

	const selectedAppLabel = defineModel<string | null>('selectedAppLabel', { default: null })

	const viewMode = ref<'total' | 'active' | 'background'>('total')

	const pieSegments = computed<PieSegment[]>(() => {
		const data = props.apps
			.map(a => ({
				domain: a.appLabel,
				seconds: a.totalSeconds,
				color: getDomainColor(a.packageName),
			}))
			.filter(d => d.seconds > 0)

		const total = data.reduce((sum, d) => sum + d.seconds, 0)
		if (total === 0) return []

		return data.map(d => ({ ...d, percent: (d.seconds / total) * 100 })).sort((a, b) => b.seconds - a.seconds)
	})

	function onSegmentClick(appLabel: string | null) {
		selectedAppLabel.value = selectedAppLabel.value === appLabel ? null : appLabel
	}
</script>

<style scoped>
	.details-grid {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.detail-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
</style>

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
				class="pa-8 d-flex flex-column align-center justify-center"
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

		<template v-else-if="!apps || apps.length === 0">
			<VCard variant="outlined">
				<ActivityEmptyState
					:probeState="emptyProbeState"
					settingsRouteName="androidSettings"
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
								<span class="text-medium-emphasis">{{ $t('activityTracking.common.totalTime') }}</span>
								<span class="font-weight-medium">{{ fromSeconds(totals?.totalSeconds ?? 0) }}</span>
							</div>
							<VDivider class="my-2" />
							<div class="detail-row">
								<span class="text-medium-emphasis">{{ $t('activityTracking.pieChart.apps') }}</span>
								<span>{{ totals?.totalApps ?? 0 }}</span>
							</div>
							<div class="detail-row">
								<span class="text-medium-emphasis">{{ $t('activityTracking.pieChart.sessions') }}</span>
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
	import ActivityPieChart from '@/core/activityTracking/component/pieChart/ActivityPieChart.vue'
	import ActivityEmptyState from '@/core/activityTracking/component/ActivityEmptyState.vue'
	import { getDomainColor } from '@/_common/utils/domainColor.ts'
	import type { PieSegment } from '@/core/activityTracking/component/pieChart/PieSegment.ts'
	import { fromSeconds } from '@/_common/utils/formatDuration.ts'
	import type { AndroidAppPieData } from '@/core/activityTracking/dto/response/android/AndroidAppPieData.ts'
	import type { AndroidPieTotals } from '@/core/activityTracking/dto/response/android/AndroidPieTotals.ts'
	import type { ActivityEmptyProbeState } from '@/core/activityTracking/composable/useActivityDashboard.ts'

	const props = defineProps<{
		apps: AndroidAppPieData[]
		totals?: AndroidPieTotals
		loading?: boolean
		error?: boolean
		emptyProbeState?: ActivityEmptyProbeState
	}>()

	const emit = defineEmits<{
		(e: 'retry'): void

		(e: 'widenWindow'): void
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

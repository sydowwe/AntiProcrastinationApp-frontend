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

		<template v-else-if="!processes || processes.length === 0">
			<VCard variant="outlined">
				<ActivityEmptyState
					:probeState="emptyProbeState"
					:isRangeMode
					settingsRouteName="desktopSettings"
					@widenWindow="emit('widenWindow')"
				/>
			</VCard>
		</template>

		<template v-else>
			<div class="d-flex flex-column flex-md-row ga-2">
				<div class="chart-column">
					<ActivityPieChart
						v-model="viewMode"
						v-model:showTail="showTail"
						:domains="pie.segments"
						:foldedCount="pie.foldedCount"
						:selectedDomain="selectedProcessName ?? ''"
						@segmentClick="onSegmentClick"
					/>
				</div>

				<div class="flex-fill">
					<template v-if="detailsLoading">
						<VSkeletonLoader type="card" />
					</template>
					<DesktopProcessDetailsPanel
						v-else-if="processDetails"
						:details="processDetails"
						@close="onClose"
					/>
					<VCard
						v-else
						variant="outlined"
						class="pa-4"
					>
						<div class="details-grid">
							<div class="detail-row">
								<span class="text-medium-emphasis">{{ $t('activityTracking.common.totalTime') }}</span>
								<span class="font-weight-medium">{{ fromSeconds(totals?.totalSeconds ?? 0) }}</span>
							</div>
							<div class="detail-row">
								<span class="text-medium-emphasis">{{ $t('activityTracking.common.active') }}</span>
								<span>{{ fromSeconds(totals?.activeSeconds ?? 0) }}</span>
							</div>
							<div class="detail-row">
								<span class="text-medium-emphasis">{{ $t('activityTracking.common.background') }}</span>
								<span>{{ fromSeconds(totals?.backgroundSeconds ?? 0) }}</span>
							</div>
							<VDivider class="my-2" />
							<div class="detail-row">
								<span class="text-medium-emphasis">
									{{ $t('activityTracking.pieChart.processes') }}
								</span>
								<span>{{ totals?.totalProcesses ?? 0 }}</span>
							</div>
							<div class="detail-row">
								<span class="text-medium-emphasis">
									{{ $t('activityTracking.pieChart.windowTitles') }}
								</span>
								<span>{{ totals?.totalWindowTitles ?? 0 }}</span>
							</div>
							<div class="detail-row">
								<span class="text-medium-emphasis">{{ $t('activityTracking.common.entries') }}</span>
								<span>{{ totals?.totalEntries ?? 0 }}</span>
							</div>
						</div>
					</VCard>
				</div>
			</div>
		</template>
	</VCard>
</template>

<script setup lang="ts">
	import { computed, ref, watch } from 'vue'
	import ActivityPieChart from '@/core/activityTracking/component/pieChart/ActivityPieChart.vue'
	import DesktopProcessDetailsPanel from './DesktopProcessDetailsPanel.vue'
	import ActivityEmptyState from '@/core/activityTracking/component/ActivityEmptyState.vue'
	import { getDomainColor } from '@/_common/utils/domainColor.ts'
	import { foldPieTail } from '@/core/activityTracking/component/pieChart/PieSegment.ts'
	import { fromSeconds } from '@/_common/utils/formatDuration.ts'
	import { getDesktopProcessDetails } from '@/core/activityTracking/api/desktopActivityTrackingApi.ts'
	import type { DesktopProcessPieData } from '@/core/activityTracking/dto/response/desktop/DesktopProcessPieData.ts'
	import type { DesktopPieTotals } from '@/core/activityTracking/dto/response/desktop/DesktopPieTotals.ts'
	import type { DesktopProcessDetailsResponse } from '@/core/activityTracking/dto/response/desktop/DesktopProcessDetailsResponse.ts'
	import type { ActivityEmptyProbeState } from '@/core/activityTracking/composable/useActivityDashboard.ts'
	import type { Time } from '@/_common/dto/dto/Time.ts'

	const props = defineProps<{
		processes: DesktopProcessPieData[]
		totals?: DesktopPieTotals
		loading?: boolean
		error?: boolean
		from: Date
		to: Date
		// The time-of-day window behind `from`/`to`. The envelope alone cannot express it, and the
		// details lookup needs it to count the same seconds the slice it was opened from counts.
		timeFrom: Time
		timeTo: Time
		emptyProbeState?: ActivityEmptyProbeState
		isRangeMode?: boolean
	}>()

	const emit = defineEmits<{
		(e: 'retry'): void

		(e: 'widenWindow'): void
	}>()

	const selectedProcessName = defineModel<string | null>('selectedProcessName', { default: null })

	const viewMode = ref<'total' | 'active' | 'background'>('total')
	const processDetails = ref<DesktopProcessDetailsResponse | null>(null)
	const detailsLoading = ref(false)

	const showTail = ref(false)

	const pie = computed(() => {
		const metric = viewMode.value

		const data = props.processes.map(p => ({
			key: p.key,
			label: p.label,
			seconds: metric === 'total' ? p.totalSeconds : metric === 'active' ? p.activeSeconds : p.backgroundSeconds,
			color: getDomainColor(p.key),
		}))

		return foldPieTail(data, '#9e9e9e', {
			thresholdPercent: showTail.value ? 0 : undefined,
			keep: selectedProcessName.value,
		})
	})

	// Looked up by process name, which is the key: a product name is shared by every process that ships
	// under it, so looking up by it opened whichever of them came first (OP11).
	watch(selectedProcessName, async processName => {
		if (!processName) {
			processDetails.value = null
			return
		}
		const proc = props.processes.find(p => p.key === processName)
		if (!proc) return

		detailsLoading.value = true
		try {
			processDetails.value = await getDesktopProcessDetails(
				proc.key,
				props.from.toISOString(),
				props.to.toISOString(),
				{ startMinutes: props.timeFrom.getInMinutes, endMinutes: props.timeTo.getInMinutes },
			)
		} finally {
			detailsLoading.value = false
		}
	})

	function onSegmentClick(processName: string | null) {
		selectedProcessName.value = selectedProcessName.value === processName ? null : processName
	}

	function onClose() {
		selectedProcessName.value = null
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

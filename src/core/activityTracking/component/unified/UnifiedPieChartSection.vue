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

		<template v-else-if="items.length === 0">
			<VCard
				variant="outlined"
				class="h-100"
			>
				<!-- No `settingsRouteName`: the merged view has no single source to send the user to. -->
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
						:selectedDomain="selectedItem"
						@segmentClick="onSegmentClick"
					/>
				</div>

				<div class="flex-fill">
					<VCard
						variant="outlined"
						class="pa-4"
					>
						<!-- One selected item: its own split, plus which trackers saw it. -->
						<template v-if="selectedDetails">
							<div class="d-flex align-center justify-space-between mb-2">
								<span class="font-weight-medium text-truncate">{{ selectedDetails.label }}</span>
								<VBtn
									:ariaLabel="$t('activityTracking.pieChart.closeDomainDetails')"
									icon="fas fa-xmark"
									size="x-small"
									variant="text"
									@click="onSegmentClick(null)"
								/>
							</div>
							<div class="details-grid">
								<div class="detail-row">
									<span class="text-medium-emphasis">{{ $t('activityTracking.common.total') }}</span>
									<span class="font-weight-medium">
										{{ fromSeconds(selectedDetails.totalSeconds) }}
									</span>
								</div>
								<div class="detail-row">
									<span class="text-medium-emphasis">{{ $t('activityTracking.common.active') }}</span>
									<span>{{ fromSeconds(selectedDetails.activeSeconds) }}</span>
								</div>
								<div class="detail-row">
									<span class="text-medium-emphasis">
										{{ $t('activityTracking.common.background') }}
									</span>
									<span>{{ fromSeconds(selectedDetails.backgroundSeconds) }}</span>
								</div>
								<div class="detail-row">
									<span class="text-medium-emphasis">
										{{ $t('activityTracking.common.entries') }}
									</span>
									<span>{{ selectedDetails.entries }}</span>
								</div>
								<VDivider class="my-2" />
								<div class="text-medium-emphasis mb-1">
									{{ $t('activityTracking.pieChart.recordedBy') }}
								</div>
								<div class="d-flex ga-1 flex-wrap">
									<ChipWithIcon
										v-for="source in selectedDetails.sources"
										:key="source"
										:icon="sourceIcon(source)"
										size="x-small"
										variant="outlined"
									>
										{{ sourceLabel(source) }}
									</ChipWithIcon>
								</div>
							</div>
						</template>

						<!-- Nothing selected: the span's own totals, already de-overlapped. -->
						<template v-else>
							<div class="details-grid">
								<div class="detail-row">
									<span class="text-medium-emphasis">
										{{
											isRangeMode
												? $t('activityTracking.pieChart.rangeTotal')
												: $t('activityTracking.pieChart.dayTotal')
										}}
									</span>
									<span class="font-weight-medium">{{ fromSeconds(totals?.totalSeconds ?? 0) }}</span>
								</div>
								<VDivider class="my-2" />
								<div class="detail-row">
									<span class="text-medium-emphasis">{{ $t('activityTracking.common.active') }}</span>
									<span>{{ fromSeconds(totals?.activeSeconds ?? 0) }}</span>
								</div>
								<div class="detail-row">
									<span class="text-medium-emphasis">
										{{ $t('activityTracking.common.background') }}
									</span>
									<span>{{ fromSeconds(totals?.backgroundSeconds ?? 0) }}</span>
								</div>
								<div class="detail-row">
									<span class="text-medium-emphasis">
										{{ $t('activityTracking.pieChart.items') }}
									</span>
									<span>{{ totals?.totalItems ?? 0 }}</span>
								</div>
								<div class="detail-row">
									<span class="text-medium-emphasis">
										{{ $t('activityTracking.pieChart.sessions') }}
									</span>
									<span>{{ totals?.totalSessions ?? 0 }}</span>
								</div>
							</div>
						</template>
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
	import ChipWithIcon from '@/_common/component/feedback/ChipWithIcon.vue'
	import { fromSeconds } from '@/_common/utils/formatDuration.ts'
	import { unifiedItemColor, useActivitySources } from '@/core/activityTracking/composable/useActivitySources.ts'
	import type { PieSegment } from '@/core/activityTracking/component/pieChart/PieSegment.ts'
	import type { UnifiedActivityItem } from '@/core/activityTracking/dto/response/unified/UnifiedActivityItem.ts'
	import type { UnifiedPieTotals } from '@/core/activityTracking/dto/response/unified/UnifiedPieTotals.ts'
	import type { ActivitySource } from '@/core/activityTracking/dto/enum/ActivitySource.ts'
	import type { ActivityEmptyProbeState } from '@/core/activityTracking/composable/useActivityDashboard.ts'

	const {
		items,
		totals,
		loading = false,
		error = false,
		otherThresholdPercent = 3,
		emptyProbeState = 'idle',
		isRangeMode = false,
	} = defineProps<{
		items: UnifiedActivityItem[]
		totals?: UnifiedPieTotals
		loading?: boolean
		error?: boolean
		otherThresholdPercent?: number
		emptyProbeState?: ActivityEmptyProbeState
		isRangeMode?: boolean
	}>()

	const emit = defineEmits<{
		retry: []
		widenWindow: []
	}>()

	/** The dashboard's shared selection, which is a `label` here — see `UnifiedActivityItem`. */
	const selectedItem = defineModel<string | null>('selectedItem', { default: null })

	const viewMode = ref<'total' | 'active' | 'background'>('total')

	const { sourceOptions, sourceLabel } = useActivitySources()

	function sourceIcon(source: ActivitySource): string {
		return sourceOptions.value.find(option => option.value === source)?.icon ?? 'fas fa-question'
	}

	const pieSegments = computed<PieSegment[]>(() => {
		const data = items
			.map(item => ({
				domain: item.label,
				seconds:
					viewMode.value === 'total'
						? item.totalSeconds
						: viewMode.value === 'active'
							? item.activeSeconds
							: item.backgroundSeconds,
				// One identity string in, one colour out, whichever source the item came from.
				color: unifiedItemColor(item.label),
			}))
			.filter(segment => segment.seconds > 0)

		const total = data.reduce((sum, segment) => sum + segment.seconds, 0)
		if (total === 0) return []

		const significant: PieSegment[] = []
		let otherSeconds = 0

		for (const segment of data) {
			const percent = (segment.seconds / total) * 100
			if (percent >= otherThresholdPercent) {
				significant.push({ ...segment, percent })
			} else {
				otherSeconds += segment.seconds
			}
		}

		if (otherSeconds > 0) {
			significant.push({
				domain: '_other',
				seconds: otherSeconds,
				percent: (otherSeconds / total) * 100,
				color: unifiedItemColor('_other'),
			})
		}

		return significant.sort((a, b) => b.seconds - a.seconds)
	})

	const selectedDetails = computed(() =>
		selectedItem.value === null ? null : (items.find(item => item.label === selectedItem.value) ?? null),
	)

	function onSegmentClick(label: string | null) {
		selectedItem.value = selectedItem.value === label ? null : label
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

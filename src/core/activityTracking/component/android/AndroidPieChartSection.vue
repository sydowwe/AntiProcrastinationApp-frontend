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
					:isRangeMode
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
					<AndroidAppDetailsPanel
						v-if="selectedDetails"
						:app="selectedDetails"
						:spanTotalSeconds="totals?.totalSeconds ?? 0"
						:details="appDetails"
						:detailsLoading
						:detailsError
						@close="onClose"
						@retry="fetchAppDetails"
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
	import { computed, onBeforeUnmount, ref, watch } from 'vue'
	import { isAxiosError } from 'axios'
	import ActivityPieChart from '@/core/activityTracking/component/pieChart/ActivityPieChart.vue'
	import ActivityEmptyState from '@/core/activityTracking/component/ActivityEmptyState.vue'
	import AndroidAppDetailsPanel, { type AndroidAppDetailsError } from './AndroidAppDetailsPanel.vue'
	import { getDomainColor } from '@/_common/utils/domainColor.ts'
	import type { PieSegment } from '@/core/activityTracking/component/pieChart/PieSegment.ts'
	import { fromSeconds } from '@/_common/utils/formatDuration.ts'
	import { getAndroidAppDetails } from '@/core/activityTracking/api/androidActivityTrackingApi.ts'
	import { isRequestCanceled } from '@/_common/axiosConfig.ts'
	import type { AndroidAppPieData } from '@/core/activityTracking/dto/response/android/AndroidAppPieData.ts'
	import type { AndroidPieTotals } from '@/core/activityTracking/dto/response/android/AndroidPieTotals.ts'
	import type { AndroidAppDetailsResponse } from '@/core/activityTracking/dto/response/android/AndroidAppDetailsResponse.ts'
	import type { ActivityEmptyProbeState } from '@/core/activityTracking/composable/useActivityDashboard.ts'
	import type { Time } from '@/_common/dto/dto/Time.ts'

	const props = defineProps<{
		apps: AndroidAppPieData[]
		totals?: AndroidPieTotals
		loading?: boolean
		error?: boolean
		from: Date
		to: Date
		// The time-of-day window behind `from`/`to` — the details lookup needs it to count the same
		// sessions the slice it was opened from counts (see `getAndroidAppDetails`).
		timeFrom: Time
		timeTo: Time
		emptyProbeState?: ActivityEmptyProbeState
		isRangeMode?: boolean
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

	// The instant half of the panel (F47): total, share and package straight off the pie row, so the
	// panel is never blank while `app-details` is in flight. The folded tail (`_other`) needs no guard —
	// `ActivityPieChart` refuses to select it, so it never reaches here.
	const selectedDetails = computed(() =>
		selectedAppLabel.value ? (props.apps.find(a => a.appLabel === selectedAppLabel.value) ?? null) : null,
	)

	const appDetails = ref<AndroidAppDetailsResponse | null>(null)
	const detailsLoading = ref(false)
	const detailsError = ref<AndroidAppDetailsError | null>(null)
	let detailsController: AbortController | null = null

	async function fetchAppDetails() {
		detailsController?.abort()
		appDetails.value = null
		detailsError.value = null

		const app = selectedDetails.value
		if (!app) return

		const controller = new AbortController()
		detailsController = controller
		detailsLoading.value = true
		try {
			appDetails.value = await getAndroidAppDetails(
				app.packageName,
				props.from.toISOString(),
				props.to.toISOString(),
				{ startMinutes: props.timeFrom.getInMinutes, endMinutes: props.timeTo.getInMinutes },
				controller.signal,
			)
		} catch (error) {
			if (isRequestCanceled(error)) return
			// 404 is the endpoint's "no session of this app starts inside the slice" — a stale
			// `?selected=` on reload, not a failure, so it gets its own sentence and no retry.
			detailsError.value = isAxiosError(error) && error.response?.status === 404 ? 'notFound' : 'failed'
		} finally {
			if (detailsController === controller) {
				detailsLoading.value = false
				detailsController = null
			}
		}
	}

	// Keyed on the package and the envelope, not the label: a range change with the same app selected
	// must re-fetch, and a label change with no matching row must clear.
	watch(() => [selectedDetails.value?.packageName, props.from.getTime(), props.to.getTime()], fetchAppDetails, {
		immediate: true,
	})

	onBeforeUnmount(() => detailsController?.abort())

	function onSegmentClick(appLabel: string | null) {
		selectedAppLabel.value = selectedAppLabel.value === appLabel ? null : appLabel
	}

	function onClose() {
		selectedAppLabel.value = null
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

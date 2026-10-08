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
			<!-- The panel drops under the chart below `md`: beside it, on a phone, it lay outside the card's
			     clip where nothing could reach it (F94). -->
			<div class="d-flex flex-column flex-md-row ga-2">
				<div class="chart-column">
					<ActivityPieChart
						v-model="viewMode"
						v-model:showTail="showTail"
						:domains="pie.segments"
						:foldedCount="pie.foldedCount"
						:selectedDomain="selectedDomain"
						@segmentClick="onSegmentClick"
					/>
				</div>

				<!-- Wrapped, like the desktop and Android sections: the card itself is `overflow: hidden`, which
				     drops its flex minimum to 0, so the chart beside it squeezed it to nothing. -->
				<div class="flex-fill">
					<ActivityDetailsPanel
						:dayTotals
						:isRangeMode
						:domain="selectedDetails"
						@close="onDetailsClose"
					/>
				</div>
			</div>

			<!-- Full width under the chart: the panel beside it is too narrow for a URL path. Keyed on the
			     domain so a new selection starts collapsed. -->
			<template v-if="selectedDetails">
				<VDivider class="my-4" />
				<DomainDetailsList
					:key="selectedDetails.key"
					:details="domainDetails"
					:loading="detailsLoading"
					:error="detailsError"
					@retry="fetchDomainDetails"
				/>
			</template>
		</template>
	</VCard>
</template>

<script setup lang="ts">
	import { computed, onBeforeUnmount, ref, watch } from 'vue'
	import { isAxiosError } from 'axios'
	import ActivityPieChart from './ActivityPieChart.vue'
	import ActivityDetailsPanel from './ActivityDetailsPanel.vue'
	import DomainDetailsList, { type DomainDetailsError } from './DomainDetailsList.vue'
	import ActivityEmptyState from '@/core/activityTracking/component/ActivityEmptyState.vue'
	import { getDomainColor } from '@/_common/utils/domainColor.ts'
	import { foldPieTail } from './PieSegment.ts'
	import { getDomainDetails } from '@/core/activityTracking/api/activityTrackingApi.ts'
	import { isRequestCanceled } from '@/_common/axiosConfig.ts'
	import type { DomainPieData } from '@/core/activityTracking/dto/response/pieChart/DomainPieData.ts'
	import type { DayTotals } from '@/core/activityTracking/dto/response/pieChart/DayTotals.ts'
	import type { DomainDetailsResponse } from '@/core/activityTracking/dto/response/DomainDetailsResponse.ts'
	import type { ActivityEmptyProbeState } from '@/core/activityTracking/composable/useActivityDashboard.ts'
	import type { Time } from '@/_common/dto/dto/Time.ts'

	const props = defineProps<{
		domains: DomainPieData[]
		dayTotals?: DayTotals
		loading?: boolean
		error?: boolean
		from: Date
		to: Date
		// The time-of-day window behind `from`/`to` — the details lookup needs it to count the same
		// entries the slice it was opened from counts (see `getDomainDetails`).
		timeFrom: Time
		timeTo: Time
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
	const showTail = ref(false)
	// Folded per metric, so the Active/Background views roll up their own tail rather than the total's.
	const pie = computed(() => {
		const metric = viewMode.value

		const data = props.domains.map(d => ({
			key: d.key,
			label: d.label,
			seconds: metric === 'total' ? d.totalSeconds : metric === 'active' ? d.activeSeconds : d.backgroundSeconds,
			color: getDomainColor(d.key),
		}))

		return foldPieTail(data, '#9e9e9e', {
			thresholdPercent: showTail.value ? 0 : undefined,
			keep: selectedDomain.value,
		})
	})

	// The instant half of the panel: the totals straight off the pie row, so it is never blank while
	// `domain-details` is in flight. The folded tail is never selectable, so it never reaches here.
	const selectedDetails = computed(() =>
		selectedDomain.value ? (props.domains.find(d => d.key === selectedDomain.value) ?? null) : null,
	)

	const domainDetails = ref<DomainDetailsResponse | null>(null)
	const detailsLoading = ref(false)
	const detailsError = ref<DomainDetailsError | null>(null)
	let detailsController: AbortController | null = null

	async function fetchDomainDetails() {
		detailsController?.abort()
		domainDetails.value = null
		detailsError.value = null

		const domain = selectedDetails.value
		if (!domain) return

		const controller = new AbortController()
		detailsController = controller
		detailsLoading.value = true
		try {
			domainDetails.value = await getDomainDetails(
				domain.key,
				props.from.toISOString(),
				props.to.toISOString(),
				{ startMinutes: props.timeFrom.getInMinutes, endMinutes: props.timeTo.getInMinutes },
				controller.signal,
			)
		} catch (error) {
			if (isRequestCanceled(error)) return
			// 404 is the endpoint's "no entry of this domain inside the slice", a stale `?selected=` on
			// reload rather than a failure, so it gets its own sentence and no retry.
			detailsError.value = isAxiosError(error) && error.response?.status === 404 ? 'notFound' : 'failed'
		} finally {
			if (detailsController === controller) {
				detailsLoading.value = false
				detailsController = null
			}
		}
	}

	// Keyed on the domain and the envelope: a range change with the same domain selected must re-fetch,
	// and a selection with no matching row must clear.
	watch(() => [selectedDetails.value?.key, props.from.getTime(), props.to.getTime()], fetchDomainDetails, {
		immediate: true,
	})

	onBeforeUnmount(() => detailsController?.abort())

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

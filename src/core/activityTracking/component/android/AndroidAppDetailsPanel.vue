<template>
	<VCard variant="outlined">
		<VCardTitle class="d-flex align-center justify-space-between">
			<span>{{ app.appLabel }}</span>
			<VBtn
				icon="fas fa-xmark"
				variant="text"
				size="small"
				density="compact"
				:ariaLabel="$t('activityTracking.pieChart.closeDetails')"
				@click="emit('close')"
			/>
		</VCardTitle>

		<VDivider />

		<VCardText>
			<!-- Instant rows, from the pie data already on the page — never blank while the fetch runs. -->
			<div class="details-grid">
				<div class="detail-row">
					<span class="text-medium-emphasis">{{ $t('activityTracking.common.total') }}</span>
					<span class="font-weight-medium">{{ fromSeconds(app.totalSeconds) }}</span>
				</div>
				<div class="detail-row">
					<span class="text-medium-emphasis">{{ $t('activityTracking.pieChart.shareOfSpan') }}</span>
					<span>{{ sharePercent }}</span>
				</div>
				<div class="detail-row">
					<span class="text-medium-emphasis">{{ $t('activityTracking.pieChart.packageName') }}</span>
					<span class="text-caption package-name">{{ app.packageName }}</span>
				</div>
			</div>

			<VDivider class="my-3" />

			<template v-if="detailsLoading">
				<VSkeletonLoader type="list-item@3" />
			</template>

			<template v-else-if="detailsError">
				<div class="d-flex flex-column align-center ga-2 py-2">
					<p class="text-body-2 text-medium-emphasis mb-0">
						{{
							detailsError === 'notFound'
								? $t('activityTracking.pieChart.appDetailsNotFound')
								: $t('activityTracking.common.loadFailed')
						}}
					</p>
					<VBtn
						v-if="detailsError !== 'notFound'"
						size="small"
						variant="outlined"
						@click="emit('retry')"
					>
						{{ $t('activityTracking.common.retry') }}
					</VBtn>
				</div>
			</template>

			<template v-else-if="details">
				<div class="details-grid">
					<div class="detail-row">
						<span class="text-medium-emphasis">{{ $t('activityTracking.pieChart.sessions') }}</span>
						<span data-testid="app-details-sessions">{{ details.sessions }}</span>
					</div>
					<div class="detail-row">
						<span class="text-medium-emphasis">{{ $t('activityTracking.pieChart.meanSession') }}</span>
						<span>{{ fromSeconds(details.meanSessionSeconds) }}</span>
					</div>
					<div class="detail-row">
						<span class="text-medium-emphasis">{{ $t('activityTracking.pieChart.longestSession') }}</span>
						<span>{{ fromSeconds(details.longestSessionSeconds) }}</span>
					</div>
					<div class="detail-row">
						<span class="text-medium-emphasis">{{ $t('activityTracking.pieChart.firstUse') }}</span>
						<span>{{ formatInstant(details.firstUseUtc) }}</span>
					</div>
					<div class="detail-row">
						<span class="text-medium-emphasis">{{ $t('activityTracking.pieChart.lastUse') }}</span>
						<span>{{ formatInstant(details.lastUseUtc) }}</span>
					</div>
				</div>

				<template v-if="details.devices.length > 1">
					<VDivider class="my-3" />
					<div class="text-subtitle-2 text-medium-emphasis mb-2">
						{{ $t('activityTracking.pieChart.devices') }}
					</div>
					<div class="details-grid">
						<div
							v-for="d in details.devices"
							:key="d.deviceId"
							class="detail-row ga-2"
						>
							<span class="text-caption package-name">{{ d.deviceId }}</span>
							<span class="flex-shrink-0">
								{{ fromSeconds(d.totalSeconds) }}
								<span class="text-medium-emphasis text-caption">
									({{
										$t('activityTracking.pieChart.sessionCount', { count: d.sessions }, d.sessions)
									}})
								</span>
							</span>
						</div>
					</div>
				</template>

				<template v-if="details.days.length > 1">
					<VDivider class="my-3" />
					<div class="text-subtitle-2 text-medium-emphasis mb-2">
						{{ $t('activityTracking.pieChart.days') }}
					</div>
					<div class="details-grid">
						<div
							v-for="day in visibleDays"
							:key="day.date"
							class="detail-row"
						>
							<span class="text-medium-emphasis">{{ formatToDateWithoutYear(day.date) }}</span>
							<span>
								{{ fromSeconds(day.totalSeconds) }}
								<span class="text-medium-emphasis text-caption">
									({{
										$t(
											'activityTracking.pieChart.sessionCount',
											{ count: day.sessions },
											day.sessions,
										)
									}})
								</span>
							</span>
						</div>
					</div>
					<VBtn
						v-if="details.days.length > maxVisibleDays"
						variant="text"
						size="small"
						class="mt-1"
						@click="expanded = !expanded"
					>
						{{
							expanded
								? $t('activityTracking.common.showLess')
								: $t('activityTracking.common.showMore', {
										count: details.days.length - maxVisibleDays,
									})
						}}
					</VBtn>
				</template>
			</template>
		</VCardText>
	</VCard>
</template>

<script setup lang="ts">
	import { computed, ref } from 'vue'
	import { fromSeconds } from '@/_common/utils/formatDuration.ts'
	import { formatToDateWithoutYear, formatToTime } from '@/_common/utils/DateTimeHelper.ts'
	import type { AndroidAppPieData } from '@/core/activityTracking/dto/response/android/AndroidAppPieData.ts'
	import type { AndroidAppDetailsResponse } from '@/core/activityTracking/dto/response/android/AndroidAppDetailsResponse.ts'

	export type AndroidAppDetailsError = 'notFound' | 'failed'

	const props = defineProps<{
		app: AndroidAppPieData
		/** The span's total, for the share row — the number the pie legend already prints. */
		spanTotalSeconds: number
		details: AndroidAppDetailsResponse | null
		detailsLoading?: boolean
		detailsError?: AndroidAppDetailsError | null
	}>()

	const emit = defineEmits<{
		close: []
		retry: []
	}>()

	const expanded = ref(false)
	const maxVisibleDays = 5

	const sharePercent = computed(() => {
		if (props.spanTotalSeconds <= 0) return '0.0 %'
		return `${((props.app.totalSeconds / props.spanTotalSeconds) * 100).toFixed(1)} %`
	})

	const visibleDays = computed(() => {
		const days = props.details?.days ?? []
		return expanded.value ? days : days.slice(0, maxVisibleDays)
	})

	function formatInstant(date: Date) {
		return `${formatToDateWithoutYear(date)} ${formatToTime(date)}`
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

	.package-name {
		font-family: monospace;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>

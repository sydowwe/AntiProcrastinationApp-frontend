<template>
	<VCard variant="outlined">
		<VCardTitle class="d-flex align-center justify-space-between">
			<span>{{ headerText }}</span>
			<VBtn
				v-if="domain"
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
			<template v-if="domain">
				<!-- Instant rows, from the pie data already on the page — never blank while the fetch runs. -->
				<div class="details-grid">
					<div class="detail-row">
						<span class="text-medium-emphasis">{{ $t('activityTracking.common.total') }}</span>
						<span class="text-high-emphasis font-weight-medium">
							{{ fromSeconds(domain.totalSeconds) }}
						</span>
					</div>

					<div class="detail-row">
						<span class="text-medium-emphasis">{{ $t('activityTracking.common.active') }}</span>
						<span>{{ fromSeconds(domain.activeSeconds) }}</span>
					</div>

					<div class="detail-row">
						<span class="text-medium-emphasis">{{ $t('activityTracking.common.background') }}</span>
						<span>{{ fromSeconds(domain.backgroundSeconds) }}</span>
					</div>

					<div class="detail-row">
						<span class="text-medium-emphasis">{{ $t('activityTracking.common.entries') }}</span>
						<span>{{ domain.entries }}</span>
					</div>
				</div>
			</template>

			<template v-else-if="dayTotals">
				<div class="details-grid">
					<div class="detail-row">
						<span class="text-medium-emphasis">{{ $t('activityTracking.common.totalTime') }}</span>
						<span class="text-high-emphasis font-weight-medium">
							{{ fromSeconds(dayTotals.totalSeconds) }}
						</span>
					</div>

					<div class="detail-row">
						<span class="text-medium-emphasis">{{ $t('activityTracking.common.active') }}</span>
						<span>{{ fromSeconds(dayTotals.activeSeconds) }}</span>
					</div>

					<div class="detail-row">
						<span class="text-medium-emphasis">{{ $t('activityTracking.common.background') }}</span>
						<span>{{ fromSeconds(dayTotals.backgroundSeconds) }}</span>
					</div>

					<VDivider class="my-3" />

					<div class="detail-row">
						<span class="text-medium-emphasis">{{ $t('activityTracking.pieChart.domains') }}</span>
						<span>{{ dayTotals.totalDomains }}</span>
					</div>

					<div class="detail-row">
						<span class="text-medium-emphasis">{{ $t('activityTracking.pieChart.pages') }}</span>
						<span>{{ dayTotals.totalPages }}</span>
					</div>

					<div class="detail-row">
						<span class="text-medium-emphasis">{{ $t('activityTracking.common.entries') }}</span>
						<span>{{ dayTotals.totalEntries }}</span>
					</div>
				</div>
			</template>
		</VCardText>
	</VCard>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { fromSeconds } from '@/_common/utils/formatDuration.ts'
	import type { DayTotals } from '@/core/activityTracking/dto/response/pieChart/DayTotals.ts'
	import type { DomainPieData } from '@/core/activityTracking/dto/response/pieChart/DomainPieData.ts'

	// Totals only. The selected domain's page list sits under the chart, because this column is too
	// narrow for a URL path (`DomainDetailsList`).
	const props = defineProps<{
		dayTotals?: DayTotals
		// The totals themselves aggregate over whatever span was requested; only the heading has to
		// stop calling a week "the day".
		isRangeMode?: boolean
		/** The selected pie row. Null shows the span's totals instead. */
		domain: DomainPieData | null
	}>()

	const emit = defineEmits<{
		close: []
	}>()

	const { t } = useI18n()

	const headerText = computed(() => {
		if (props.domain) return props.domain.label
		return props.isRangeMode ? t('activityTracking.pieChart.rangeTotal') : t('activityTracking.pieChart.dayTotal')
	})
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

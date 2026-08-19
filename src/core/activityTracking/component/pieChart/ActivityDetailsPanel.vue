<template>
	<VCard variant="outlined">
		<VCardTitle class="d-flex align-center justify-space-between">
			<span>{{ headerText }}</span>
			<VBtn
				v-if="mode === 'domain'"
				icon="mdi-close"
				variant="text"
				size="small"
				density="compact"
				:aria-label="$t('activityTracking.pieChart.closeDomainDetails')"
				@click="emit('close')"
			/>
		</VCardTitle>

		<VDivider />

		<VCardText>
			<template v-if="mode === 'dayTotal' && dayTotals">
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
						<span class="text-medium-emphasis">{{ $t('activityTracking.pieChart.visits') }}</span>
						<span>{{ dayTotals.totalVisits ?? '-' }}</span>
					</div>
				</div>
			</template>

			<template v-else-if="mode === 'domain' && domainDetails">
				<div class="details-grid">
					<div class="detail-row">
						<span class="text-medium-emphasis">{{ $t('activityTracking.common.total') }}</span>
						<span class="text-high-emphasis font-weight-medium">
							{{ fromSeconds(domainDetails.totalSeconds) }}
						</span>
					</div>

					<div class="detail-row">
						<span class="text-medium-emphasis">{{ $t('activityTracking.common.active') }}</span>
						<span>{{ fromSeconds(domainDetails.activeSeconds) }}</span>
					</div>

					<div class="detail-row">
						<span class="text-medium-emphasis">{{ $t('activityTracking.common.background') }}</span>
						<span>{{ fromSeconds(domainDetails.backgroundSeconds) }}</span>
					</div>

					<div class="detail-row">
						<span class="text-medium-emphasis">{{ $t('activityTracking.common.entries') }}</span>
						<span>{{ domainDetails.entries }}</span>
					</div>
				</div>

				<VDivider class="my-4" />

				<DomainDetailsList :pages="domainDetails.pages" />
			</template>
		</VCardText>
	</VCard>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { fromSeconds } from '@/_common/utils/formatDuration.ts'
	import DomainDetailsList from './DomainDetailsList.vue'
	import type { DayTotals } from '@/core/activityTracking/dto/response/pieChart/DayTotals.ts'
	import type { DomainPieData } from '@/core/activityTracking/dto/response/pieChart/DomainPieData.ts'

	const props = defineProps<{
		mode: 'dayTotal' | 'domain'
		dayTotals?: DayTotals
		domainDetails: DomainPieData | null
	}>()

	const emit = defineEmits<{
		(e: 'close'): void
	}>()

	const { t } = useI18n()

	const headerText = computed(() => {
		if (props.mode === 'dayTotal') {
			return t('activityTracking.pieChart.dayTotal')
		} else if (props.domainDetails) {
			return props.domainDetails.domain
		}
		return t('activityTracking.pieChart.details')
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

<template>
	<VCard variant="outlined">
		<VCardTitle class="d-flex align-center justify-space-between">
			<span>{{ details.productName }}</span>
			<VBtn
				icon="fas fa-xmark"
				variant="text"
				size="small"
				density="compact"
				@click="emit('close')"
			/>
		</VCardTitle>

		<VDivider />

		<VCardText>
			<div class="details-grid">
				<div class="detail-row">
					<span class="text-medium-emphasis">{{ $t('activityTracking.common.total') }}</span>
					<span class="font-weight-medium">{{ fromSeconds(details.totalSeconds) }}</span>
				</div>
				<div class="detail-row">
					<span class="text-medium-emphasis">{{ $t('activityTracking.common.active') }}</span>
					<span>{{ fromSeconds(details.activeSeconds) }}</span>
				</div>
				<div class="detail-row">
					<span class="text-medium-emphasis">{{ $t('activityTracking.common.background') }}</span>
					<span>{{ fromSeconds(details.backgroundSeconds) }}</span>
				</div>
				<template v-if="details.fullscreenSeconds > 0">
					<div class="detail-row">
						<span class="text-medium-emphasis">{{ $t('activityTracking.pieChart.fullscreen') }}</span>
						<span>{{ fromSeconds(details.fullscreenSeconds) }}</span>
					</div>
				</template>
				<template v-if="details.soundSeconds > 0">
					<div class="detail-row">
						<span class="text-medium-emphasis">{{ $t('activityTracking.pieChart.playingSound') }}</span>
						<span>{{ fromSeconds(details.soundSeconds) }}</span>
					</div>
				</template>
				<div class="detail-row">
					<span class="text-medium-emphasis">{{ $t('activityTracking.common.entries') }}</span>
					<span>{{ details.entries }}</span>
				</div>
			</div>

			<template v-if="details.monitorBreakdown.length > 1">
				<VDivider class="my-3" />
				<div class="text-subtitle-2 text-medium-emphasis mb-2">
					{{ $t('activityTracking.pieChart.monitorBreakdown') }}
				</div>
				<div class="details-grid">
					<div
						v-for="m in details.monitorBreakdown"
						:key="m.monitor"
						class="detail-row"
					>
						<span class="text-medium-emphasis">
							{{ $t('activityTracking.pieChart.monitor', { n: m.monitor }) }}
						</span>
						<span>{{ fromSeconds(m.activeSeconds) }}</span>
					</div>
				</div>
			</template>

			<template v-if="details.windowTitles.length > 0">
				<VDivider class="my-3" />
				<div class="text-subtitle-2 text-medium-emphasis mb-2">
					{{ $t('activityTracking.pieChart.windowTitles') }}
				</div>
				<VList
					density="compact"
					class="py-0"
				>
					<VListItem
						v-for="(wt, i) in visibleWindowTitles"
						:key="i"
						class="px-0"
					>
						<template #title>
							<div class="d-flex justify-space-between align-center ga-2">
								<span class="window-title-text">{{ wt.windowTitle }}</span>
								<span class="text-medium-emphasis text-caption flex-shrink-0">
									{{ fromSeconds(wt.totalSeconds) }}
								</span>
							</div>
						</template>
					</VListItem>
				</VList>
				<VBtn
					v-if="details.windowTitles.length > maxVisible"
					variant="text"
					size="small"
					class="mt-1"
					@click="expanded = !expanded"
				>
					{{
						expanded
							? $t('activityTracking.common.showLess')
							: $t('activityTracking.common.showMore', {
									count: details.windowTitles.length - maxVisible,
								})
					}}
				</VBtn>
			</template>
		</VCardText>
	</VCard>
</template>

<script setup lang="ts">
	import { computed, ref } from 'vue'
	import { fromSeconds } from '@/_common/utils/formatDuration.ts'
	import type { DesktopProcessDetailsResponse } from '@/core/activityTracking/dto/response/desktop/DesktopProcessDetailsResponse.ts'

	const props = defineProps<{
		details: DesktopProcessDetailsResponse
	}>()

	const emit = defineEmits<{
		close: []
	}>()

	const expanded = ref(false)
	const maxVisible = 5

	const visibleWindowTitles = computed(() =>
		expanded.value ? props.details.windowTitles : props.details.windowTitles.slice(0, maxVisible),
	)
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

	.window-title-text {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 12px;
	}
</style>

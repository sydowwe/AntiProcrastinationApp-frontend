<template>
	<VCard variant="outlined">
		<VCardTitle class="d-flex align-center justify-space-between">
			<span>{{ details.productName || details.processName }}</span>
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
				<!-- The identity the panel was opened by: several processes can share the title's product name. -->
				<div class="detail-row">
					<span class="text-medium-emphasis">{{ $t('activityTracking.pieChart.processName') }}</span>
					<span
						class="text-caption"
						style="font-family: monospace"
						data-testid="process-details-process-name"
					>
						{{ details.processName }}
					</span>
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
						<!-- Only when it says more than the total does: an all-foreground row has nothing to split. -->
						<template
							v-if="titleSplit(wt)"
							#subtitle
						>
							<span
								class="text-caption"
								data-testid="window-title-split"
							>
								{{ titleSplit(wt) }}
							</span>
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
	import { useI18n } from 'vue-i18n'
	import { fromSeconds, fromSecondsDetailed } from '@/_common/utils/formatDuration.ts'
	import type {
		DesktopProcessDetailsResponse,
		DesktopWindowTitleStats,
	} from '@/core/activityTracking/dto/response/desktop/DesktopProcessDetailsResponse.ts'

	const props = defineProps<{
		details: DesktopProcessDetailsResponse
	}>()

	const emit = defineEmits<{
		close: []
	}>()

	const { t } = useI18n()

	const expanded = ref(false)
	const maxVisible = 5

	/**
	 * "20m active · 5m in background · 15m fullscreen · 10m with sound", leaving out every zero part.
	 * The server counts fullscreen and sound from a title's *active* seconds only, so both are shares
	 * of the active part, not further additions to the total. A title with no background, fullscreen
	 * or sound time returns '' — its total already says everything.
	 */
	function titleSplit(wt: DesktopWindowTitleStats): string {
		if (wt.backgroundSeconds <= 0 && wt.fullscreenSeconds <= 0 && wt.soundSeconds <= 0) return ''
		const parts: [key: string, seconds: number][] = [
			['splitActive', wt.activeSeconds],
			['splitBackground', wt.backgroundSeconds],
			['splitFullscreen', wt.fullscreenSeconds],
			['splitSound', wt.soundSeconds],
		]
		return parts
			.filter(([, seconds]) => seconds > 0)
			.map(([key, seconds]) => t(`activityTracking.pieChart.${key}`, { duration: formatPart(seconds) }))
			.join(' · ')
	}

	// `fromSeconds` floors a sub-minute part to "0m", which reads as a part that is not there.
	function formatPart(seconds: number): string {
		return seconds < 60 ? fromSecondsDetailed(seconds) : fromSeconds(seconds)
	}

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

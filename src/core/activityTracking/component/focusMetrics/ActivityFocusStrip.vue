<template>
	<!--
		Hidden outright rather than shown empty when there is nothing to describe. That covers a
		multi-day range too, where the timeline these numbers come from is never fetched — the same
		single-day-only constraint the visualization toggle already explains in its own tooltip.
	-->
	<VCard
		v-if="loading || metrics !== null"
		variant="outlined"
		class="pa-3"
	>
		<div class="d-flex align-center ga-6 flex-wrap">
			<div class="d-flex align-center ga-2 text-medium-emphasis">
				<VIcon
					icon="fas fa-wave-square"
					size="16"
				/>
				<span class="text-overline">{{ $t('activityTracking.focus.title') }}</span>
			</div>

			<template v-if="loading">
				<VSkeletonLoader
					v-for="i in 4"
					:key="i"
					type="text"
					width="110"
				/>
			</template>

			<template v-else>
				<div
					v-for="stat in stats"
					:key="stat.key"
					class="focus-stat"
				>
					<div class="text-caption text-medium-emphasis">{{ stat.label }}</div>
					<div class="text-subtitle-1 font-weight-medium">{{ stat.value }}</div>
					<div
						v-if="stat.detail"
						class="text-caption text-disabled text-truncate"
					>
						{{ stat.detail }}
					</div>
					<VTooltip
						activator="parent"
						location="bottom"
						maxWidth="280"
					>
						{{ stat.hint }}
					</VTooltip>
				</div>
			</template>
		</div>
	</VCard>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { fromSeconds, fromSecondsDetailed } from '@/_common/utils/formatDuration.ts'
	import {
		FOCUS_BLOCK_TOLERANCE_SECONDS,
		type FocusMetrics,
	} from '@/core/activityTracking/composable/focusMetrics.ts'

	const { metrics, loading = false } = defineProps<{
		metrics: FocusMetrics | null
		loading?: boolean
	}>()

	const { t } = useI18n()

	interface FocusStat {
		key: string
		label: string
		value: string
		detail?: string
		hint: string
	}

	/** `fromSeconds` floors to whole minutes and renders anything shorter as `0m`, which is wrong for a
	 *  median session or a short break — those are exactly the small numbers worth reading. */
	function formatSpan(seconds: number): string {
		return seconds < 60 ? fromSecondsDetailed(seconds) : fromSeconds(seconds)
	}

	/**
	 * Reported as counts and durations, never as a verdict. No thresholds, no colour coding, no
	 * composite index: the switch count and the longest block are shown side by side precisely so the
	 * shape stays legible instead of collapsing into a single number that hides its own mechanism.
	 */
	const stats = computed<FocusStat[]>(() => {
		if (metrics === null) {
			return []
		}

		const entries: FocusStat[] = [
			{
				key: 'switches',
				label: t('activityTracking.focus.switches'),
				value: String(metrics.switchCount),
				hint: t('activityTracking.focus.switchesHint'),
			},
		]

		if (metrics.longestBlock !== null) {
			entries.push({
				key: 'longestBlock',
				label: t('activityTracking.focus.longestBlock'),
				value: formatSpan(metrics.longestBlock.seconds),
				detail: metrics.longestBlock.label,
				hint: t('activityTracking.focus.longestBlockHint', {
					minutes: FOCUS_BLOCK_TOLERANCE_SECONDS / 60,
				}),
			})
		}

		entries.push({
			key: 'medianSession',
			label: t('activityTracking.focus.medianSession'),
			value: formatSpan(metrics.medianSessionSeconds),
			detail: t('activityTracking.focus.sessionCount', { count: metrics.sessionCount }),
			hint: t('activityTracking.focus.medianSessionHint'),
		})

		if (metrics.longestGapSeconds !== null) {
			entries.push({
				key: 'longestBreak',
				label: t('activityTracking.focus.longestBreak'),
				value: formatSpan(metrics.longestGapSeconds),
				hint: t('activityTracking.focus.longestBreakHint'),
			})
		}

		return entries
	})
</script>

<style scoped>
	.focus-stat {
		min-width: 110px;
		max-width: 200px;
	}
</style>

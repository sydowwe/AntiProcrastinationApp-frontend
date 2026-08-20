<template>
	<!--
		Hidden outright rather than shown empty when there is nothing to describe. Unlike before, that
		no longer means "a multi-day range": the metrics come from their own endpoint now and are
		computed over a range as well as a day.
	-->
	<VCard
		v-if="loading || error || metrics !== null"
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

			<!-- Its own quiet failure: the request is `_silent`, so this panel is the only place it shows. -->
			<div
				v-else-if="error"
				class="d-flex align-center ga-3"
			>
				<VIcon
					icon="fas fa-triangle-exclamation"
					size="16"
					class="text-disabled"
				/>
				<span class="text-body-2 text-medium-emphasis">{{ $t('activityTracking.common.loadFailed') }}</span>
				<VBtn
					size="small"
					variant="outlined"
					@click="emit('retry')"
				>
					{{ $t('activityTracking.common.retry') }}
				</VBtn>
			</div>

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
					<!--
						The comparison against the user's own recent figure. Deliberately the same muted
						treatment as any other secondary line: no percentage, no arrow, no up/down colour.
					-->
					<div
						v-if="stat.comparison"
						class="text-caption text-disabled text-truncate"
					>
						{{ stat.comparison }}
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
	import { FOCUS_BLOCK_TOLERANCE_SECONDS } from '@/core/activityTracking/composable/focusMetrics.ts'
	import type { FocusMetricsResponse } from '@/core/activityTracking/dto/response/focusMetrics/FocusMetricsResponse.ts'

	const {
		metrics,
		loading = false,
		error = false,
	} = defineProps<{
		metrics: FocusMetricsResponse | null
		loading?: boolean
		error?: boolean
	}>()

	const emit = defineEmits<{
		retry: []
	}>()

	const { t } = useI18n()

	interface FocusStat {
		key: string
		label: string
		value: string
		detail?: string
		comparison?: string
		hint: string
	}

	/** `fromSeconds` floors to whole minutes and renders anything shorter as `0m`, which is wrong for a
	 *  median session or a short break — those are exactly the small numbers worth reading. */
	function formatSpan(seconds: number): string {
		return seconds < 60 ? fromSecondsDetailed(seconds) : fromSeconds(seconds)
	}

	function comparisonLine(value: string): string {
		return t('activityTracking.focus.comparison', { value })
	}

	/**
	 * Whether the span covers more than one day of actual activity. Read off `daysWithActivity` rather
	 * than off the date picker: days the user was away must not dilute a per-day figure, and a week
	 * containing a single working day is one day's worth of shape.
	 */
	const spansMultipleDays = computed(() => (metrics?.daysWithActivity ?? 0) > 1)

	/**
	 * Reported as counts and durations, never as a verdict. No thresholds, no colour coding, no
	 * composite index: the switch count and the longest block are shown side by side precisely so the
	 * shape stays legible instead of collapsing into a single number that hides its own mechanism.
	 *
	 * The baseline fields are NOT all on the same scale, which is the one thing easy to get wrong here.
	 * `switchCount` is scaled to the span and `medianSessionSeconds` is scale-free, so both compare
	 * directly. `longestBlockSeconds` and `longestGapSeconds` are per-day MEANS, while the figures
	 * shown beside them are single maxima over the whole span — over more than one day those are
	 * different quantities, so the comparison is omitted rather than printed as if they matched.
	 */
	const stats = computed<FocusStat[]>(() => {
		if (metrics === null) {
			return []
		}

		const baseline = metrics.baseline
		const perDayDivisor = Math.max(metrics.daysWithActivity, 1)

		const entries: FocusStat[] = [
			{
				key: 'switches',
				label: t('activityTracking.focus.switches'),
				value: String(metrics.switchCount),
				// A span total is what the other numbers are on, but "87 switches" over a week is not a
				// figure anyone reads — the per-day rate is, so it goes in the detail line beneath it.
				detail: spansMultipleDays.value
					? t('activityTracking.focus.perDay', {
							value: Math.round(metrics.switchCount / perDayDivisor),
						})
					: undefined,
				comparison:
					baseline?.switchCount != null
						? comparisonLine(String(Math.round(baseline.switchCount)))
						: undefined,
				hint: t('activityTracking.focus.switchesHint'),
			},
		]

		if (metrics.longestBlock !== null) {
			entries.push({
				key: 'longestBlock',
				label: t('activityTracking.focus.longestBlock'),
				value: formatSpan(metrics.longestBlock.seconds),
				detail: metrics.longestBlock.label,
				comparison:
					!spansMultipleDays.value && baseline?.longestBlockSeconds != null
						? comparisonLine(formatSpan(baseline.longestBlockSeconds))
						: undefined,
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
			comparison:
				baseline?.medianSessionSeconds != null
					? comparisonLine(formatSpan(baseline.medianSessionSeconds))
					: undefined,
			hint: t('activityTracking.focus.medianSessionHint'),
		})

		if (metrics.longestGapSeconds !== null) {
			entries.push({
				key: 'longestBreak',
				label: t('activityTracking.focus.longestBreak'),
				value: formatSpan(metrics.longestGapSeconds),
				comparison:
					!spansMultipleDays.value && baseline?.longestGapSeconds != null
						? comparisonLine(formatSpan(baseline.longestGapSeconds))
						: undefined,
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

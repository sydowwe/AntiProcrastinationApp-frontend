<template>
	<SubtleCard
		v-if="lines.length > 0"
		color="primaryOutline"
		:title="$t('historyDashboard.insights.title')"
		shortTitle
		icon="fas fa-lightbulb"
	>
		<div class="d-flex flex-column ga-2">
			<div
				v-for="line in lines"
				:key="line.kind"
				class="d-flex align-start ga-2"
			>
				<VIcon
					:icon="line.icon"
					size="16"
					color="primary"
					style="margin-top: 3px; flex-shrink: 0"
				/>
				<p class="text-body-2 ma-0">
					<!-- One key per whole sentence; the slots below fill the placeholders the message names
					     and the rest go unread. Nothing here concatenates fragments. -->
					<i18n-t
						:keypath="line.keypath"
						tag="span"
						scope="global"
					>
						<template #name>
							<strong>{{ line.params.name }}</strong>
						</template>
						<template #total>
							<strong>{{ line.params.total }}</strong>
						</template>
						<template #entries>
							<strong>{{ line.params.entries }}</strong>
						</template>
						<template #mean>
							<strong>{{ line.params.mean }}</strong>
						</template>
						<template #from>
							<strong>{{ line.params.from }}</strong>
						</template>
						<template #to>
							<strong>{{ line.params.to }}</strong>
						</template>
						<template #share>
							<strong>{{ line.params.share }}</strong>
						</template>
					</i18n-t>
				</p>
			</div>
		</div>
	</SubtleCard>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import SubtleCard from '@/_common/component/feedback/SubtleCard.vue'
	import type { HistoryPieChartResponse } from '@/core/historyDashboard/dto/response/HistoryPieChartResponse.ts'
	import type { HistoryTimeOfDayResponse } from '@/core/historyDashboard/dto/response/HistoryTimeOfDayResponse.ts'
	import {
		type HistoryInsight,
		type HistoryInsightKind,
		useHistoryInsights,
	} from '@/core/historyDashboard/composable/useHistoryInsights.ts'
	import { fromMinutes, fromSeconds, fromSecondsDetailed } from '@/_common/utils/formatDuration.ts'

	const {
		data,
		timeOfDay = null,
		loading = false,
	} = defineProps<{
		data: HistoryPieChartResponse | null
		timeOfDay?: HistoryTimeOfDayResponse | null
		loading?: boolean
	}>()

	// Collapsing `loading` to `null` rather than keeping the previous round's sentences on screen: the
	// panels around this one swap to skeletons while a new period loads, and a stale sentence under a new
	// period's header is the one way a wrong conclusion reads as a true one (same rule as the fetchers in
	// `useHistoryDashboard`). The whole card is `v-if`'d away, so nothing renders half-answered.
	const insights = useHistoryInsights(
		() => (loading ? null : data),
		() => (loading ? null : timeOfDay),
	)

	const INSIGHT_ICONS: Record<HistoryInsightKind, string> = {
		sessionLength: 'fas fa-stopwatch',
		timeOfDay: 'fas fa-clock',
		mostFragmented: 'fas fa-ellipsis',
		longestStretches: 'fas fa-ruler-horizontal',
	}

	interface InsightLine {
		kind: HistoryInsightKind
		icon: string
		keypath: string
		/** Interpolation values, already formatted. Each sentence reads only the ones it names. */
		params: Record<string, string | number>
	}

	/**
	 * A mean is a fraction of a second wide; `fromSeconds` would print a sub-minute one as `0m`. Rounded
	 * to whole minutes above a minute, kept in seconds below it.
	 */
	function formatMean(seconds: number): string {
		if (seconds < 60) return fromSecondsDetailed(Math.round(seconds))
		return fromMinutes(Math.round(seconds / 60))
	}

	/** The band's bounds are whole hours in the user's zone, so they render as whole hours. */
	function formatHour(hour: number): string {
		return `${String(hour).padStart(2, '0')}:00`
	}

	function toLine(insight: HistoryInsight): InsightLine {
		const base = {
			kind: insight.kind,
			icon: INSIGHT_ICONS[insight.kind],
			keypath: `historyDashboard.insights.${insight.kind}`,
		}
		switch (insight.kind) {
			case 'sessionLength':
				return {
					...base,
					params: {
						total: fromSeconds(insight.totalSeconds),
						entries: insight.entries,
						mean: formatMean(insight.meanSeconds),
					},
				}
			case 'timeOfDay':
				return {
					...base,
					params: {
						from: formatHour(insight.startHour),
						to: formatHour(insight.endHour),
						total: fromSeconds(insight.windowSeconds),
						share: Math.round(insight.share * 100),
					},
				}
			default:
				return {
					...base,
					params: {
						name: insight.name,
						total: fromSeconds(insight.totalSeconds),
						entries: insight.entries,
						mean: formatMean(insight.meanSeconds),
					},
				}
		}
	}

	const lines = computed<InsightLine[]>(() => insights.value.map(toLine))
</script>

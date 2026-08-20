<template>
	<VCard
		variant="outlined"
		class="pa-3"
	>
		<div class="d-flex align-center ga-4 flex-wrap">
			<div class="d-flex align-center ga-2 text-medium-emphasis">
				<VIcon
					icon="fas fa-layer-group"
					size="16"
				/>
				<span class="text-overline">{{ $t('activityTracking.sources.title') }}</span>
			</div>

			<template v-if="loading">
				<VSkeletonLoader
					v-for="i in 3"
					:key="i"
					type="chip"
					width="150"
				/>
			</template>

			<!--
				The chips survive a failed round, unlike every other panel in this module. This is the
				control a user reaches for when the dashboard came back empty or wrong, so it must not
				be the thing that disappears. Only the figures go — stale seconds labelled as current
				would be worse than none — and the failure is reported below instead.
			-->
			<template v-else>
				<VChip
					v-for="option in sourceOptions"
					:key="option.value"
					:prependIcon="option.icon"
					:variant="isSelected(option.value) ? 'tonal' : 'outlined'"
					:color="isSelected(option.value) ? 'primaryOutline' : 'textMuted'"
					@click="toggle(option.value)"
				>
					{{ option.label }}
					<span class="ms-2 text-caption font-weight-medium">{{ chipFigure(option.value) }}</span>

					<VTooltip
						activator="parent"
						location="bottom"
					>
						{{ chipTooltip(option.value) }}
					</VTooltip>
				</VChip>
			</template>
		</div>

		<div
			v-if="!loading && error"
			class="d-flex align-center ga-3 mt-3"
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

		<!--
			The resolution, said out loud. A merged total is smaller than the three dashboards add up
			to, and without this line there is no way to tell whether the missing time was attributed
			elsewhere, halved, or dropped.
		-->
		<div
			v-else-if="!loading && overlapSeconds > 0"
			class="d-flex align-start ga-2 mt-3 text-caption text-medium-emphasis"
		>
			<VIcon
				icon="fas fa-circle-info"
				size="14"
				class="mt-1"
			/>
			<div>
				<div>{{ $t('activityTracking.sources.overlapNote', { value: formatSeconds(overlapSeconds) }) }}</div>
				<div
					v-for="line in displacementLines"
					:key="line"
					class="text-disabled"
				>
					{{ line }}
				</div>
				<div class="text-disabled">{{ $t('activityTracking.sources.overlapRule') }}</div>
			</div>
		</div>
	</VCard>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { fromSeconds, fromSecondsDetailed } from '@/_common/utils/formatDuration.ts'
	import { useActivitySources } from '@/core/activityTracking/composable/useActivitySources.ts'
	import type { ActivitySource } from '@/core/activityTracking/dto/enum/ActivitySource.ts'
	import type { UnifiedSourceBreakdown } from '@/core/activityTracking/dto/response/unified/UnifiedSourceBreakdown.ts'

	const {
		breakdown,
		loading = false,
		error = false,
	} = defineProps<{
		breakdown: UnifiedSourceBreakdown[]
		loading?: boolean
		error?: boolean
	}>()

	const emit = defineEmits<{
		retry: []
	}>()

	/** Never empty — see `toggle`. */
	const sources = defineModel<ActivitySource[]>('sources', { required: true })

	const { t } = useI18n()
	const { sourceOptions, sourceLabel } = useActivitySources()

	const bySource = computed(() => new Map(breakdown.map(entry => [entry.source, entry])))

	/**
	 * Total wall-clock that more than one selected source claimed. Summing `displacedSeconds` counts it
	 * once by construction: a displaced second belongs to exactly one loser and exactly one winner.
	 */
	const overlapSeconds = computed(() => breakdown.reduce((sum, entry) => sum + entry.displacedSeconds, 0))

	/** One line per source that lost time, naming who took it — the "not silently halved" evidence. */
	const displacementLines = computed(() =>
		breakdown
			.filter(entry => entry.displacedSeconds > 0 && entry.displacedTo !== null)
			.map(entry =>
				t('activityTracking.sources.displaced', {
					value: formatSeconds(entry.displacedSeconds),
					source: sourceLabel(entry.source),
					target: sourceLabel(entry.displacedTo!),
				}),
			),
	)

	function isSelected(source: ActivitySource): boolean {
		return sources.value.includes(source)
	}

	/** `fromSeconds` floors to whole minutes and renders anything shorter as `0m` — which is exactly
	 *  wrong for a displacement figure, where a small number is the interesting one. */
	function formatSeconds(seconds: number): string {
		return seconds < 60 ? fromSecondsDetailed(seconds) : fromSeconds(seconds)
	}

	function chipFigure(source: ActivitySource): string {
		const entry = bySource.value.get(source)
		// Nothing on a deselected chip (it contributed nothing by definition) and nothing after a
		// failed round (the last figures describe a span or a selection that is no longer on screen).
		if (!isSelected(source) || error) {
			return ''
		}
		if (entry === undefined || !entry.hasData) {
			return t('activityTracking.sources.noData')
		}
		return formatSeconds(entry.countedSeconds)
	}

	function chipTooltip(source: ActivitySource): string {
		if (isSelected(source) && sources.value.length === 1) {
			return t('activityTracking.sources.keepOne')
		}
		if (!isSelected(source)) {
			return t('activityTracking.sources.include', { source: sourceLabel(source) })
		}
		const entry = bySource.value.get(source)
		if (entry !== undefined && entry.displacedSeconds > 0 && entry.displacedTo !== null) {
			return t('activityTracking.sources.displaced', {
				value: formatSeconds(entry.displacedSeconds),
				source: sourceLabel(source),
				target: sourceLabel(entry.displacedTo),
			})
		}
		return t('activityTracking.sources.exclude', { source: sourceLabel(source) })
	}

	/**
	 * The last selected source cannot be turned off — an empty selection asks the server for a picture
	 * of nothing, and every panel would render its empty state with no way to read why. The chip stays
	 * clickable so the tooltip can say so rather than the click silently doing nothing.
	 */
	function toggle(source: ActivitySource) {
		if (isSelected(source)) {
			if (sources.value.length === 1) return
			sources.value = sources.value.filter(selected => selected !== source)
			return
		}
		// Rebuilt in `sourceOptions` order so the request body is identical however it was assembled.
		sources.value = sourceOptions.value
			.map(option => option.value)
			.filter(value => value === source || isSelected(value))
	}
</script>

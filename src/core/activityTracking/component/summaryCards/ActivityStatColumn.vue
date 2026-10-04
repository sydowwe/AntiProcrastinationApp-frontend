<template>
	<div class="stat-column">
		<div class="text-caption text-medium-emphasis mb-1">
			{{ label }}
		</div>
		<div class="text-h6 font-weight-bold mb-1">
			{{ formattedTime }}
		</div>
		<div style="font-size: 0.85rem !important">
			<VChip
				v-if="isNew"
				size="x-small"
				color="info"
				variant="flat"
				style="font-size: 0.7rem !important"
			>
				{{ $t('activityTracking.statColumn.new') }}
			</VChip>
			<template v-else-if="percentChange !== null">
				<div
					:class="comparisonClass"
					:aria-label="comparisonAriaLabel"
					style="font-size: 0.85rem !important"
				>
					{{ comparisonText }}
				</div>
				<!-- OP14: the base the percentage is taken against, on the same scale as the time above. -->
				<div
					v-if="formattedBaseline"
					class="text-caption text-medium-emphasis"
				>
					{{ $t('activityTracking.statColumn.usually', { duration: formattedBaseline }) }}
				</div>
			</template>
			<div
				v-else
				class="text-caption text-disabled"
			>
				-
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { fromSeconds, fromSecondsDetailed } from '@/_common/utils/formatDuration.ts'

	const props = defineProps<{
		label: string
		seconds: number
		/** The baseline scaled to the selected span — what `seconds` usually is. Null when the item is new. */
		averageSeconds: number | null
		percentChange: number | null
		isNew: boolean
	}>()

	const { t } = useI18n()

	const formattedTime = computed(() => fromSeconds(props.seconds))

	// A baseline under a minute is still a base; `fromSeconds` would floor it to "0m".
	const formattedBaseline = computed(() => {
		if (props.averageSeconds == null || props.averageSeconds <= 0) return ''
		return props.averageSeconds < 60 ? fromSecondsDetailed(props.averageSeconds) : fromSeconds(props.averageSeconds)
	})

	const comparisonText = computed(() => {
		if (props.percentChange === null) return ''
		if (props.percentChange === 0) return '━ 0%'
		if (props.percentChange > 0) return `▲ ${Math.abs(props.percentChange)}%`
		return `▼ ${Math.abs(props.percentChange)}%`
	})

	const comparisonClass = computed(() => {
		if (props.percentChange === null) return ''
		if (props.percentChange === 0) return 'text-caption text-medium-emphasis'
		if (props.percentChange > 0) return 'text-caption text-success'
		return 'text-caption text-error'
	})

	const comparisonAriaLabel = computed(() => {
		if (props.percentChange === null) return ''
		if (props.percentChange === 0) return t('activityTracking.statColumn.noChange')
		if (props.percentChange > 0) {
			return t('activityTracking.statColumn.aboveAverage', { percent: Math.abs(props.percentChange) })
		}
		return t('activityTracking.statColumn.belowAverage', { percent: Math.abs(props.percentChange) })
	})
</script>

<style scoped>
	.stat-column {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: 12px 8px;
		min-width: 80px;
	}
</style>

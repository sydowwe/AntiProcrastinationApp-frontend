<template>
	<!--
		A bar is a control only where the parent bound a handler (`interactive`): there it is a
		button that opens the item's details. Elsewhere it is a named graphic — `role="img"` with the
		same label the tooltip spells out on hover, since the tooltip is mouse-only and the label is
		the one thing a screen reader or the accessibility snapshot can read off the chart (F29).
	-->
	<div
		class="bar-column"
		:class="{ 'bar-column--interactive': interactive }"
		:style="barContainerStyle"
		:role="interactive ? 'button' : 'img'"
		:tabindex="interactive ? 0 : undefined"
		:aria-label="ariaLabel"
		@mouseenter="$emit('mouseenter', $event)"
		@mouseleave="$emit('mouseleave', $event)"
		@click="onActivate"
		@keydown.enter.space.prevent="onActivate"
	>
		<!-- Background portion (top, striped) -->
		<div
			v-if="data.backgroundSeconds > 0"
			class="bar-segment bar-background"
			:style="backgroundStyle"
		/>
		<!-- Active portion (bottom, solid) -->
		<div
			v-if="data.activeSeconds > 0"
			class="bar-segment bar-active"
			:style="activeStyle"
		/>
	</div>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { getDomainColor } from '@/_common/utils/domainColor.ts'
	import type { ColumnData } from '@/core/activityTracking/component/stackedBars/dto/ColumnData.ts'
	import { lightenColor } from '@/_common/utils/colorUtils.ts'
	import { fromSeconds } from '@/_common/utils/formatDuration.ts'
	import { OTHER_DOMAIN } from '@/core/activityTracking/component/pieChart/PieSegment.ts'

	const props = defineProps<{
		data: ColumnData
		gridColumnStart: number
		gridColumnEnd: number
		gridRowStart: number
		gridRowEnd: number
		windowMinutes: number
		/** The window's time range, already formatted by the grid — the only layer that knows it. */
		windowLabel: string
		/** True when the chart's consumer bound a click handler; the bar is then a button, else a graphic. */
		interactive?: boolean
	}>()

	const emit = defineEmits<{
		(e: 'mouseenter', event: MouseEvent): void
		(e: 'mouseleave', event: MouseEvent): void
		(e: 'click'): void
	}>()

	const { t } = useI18n()

	const domainColor = computed(() => props.data.color ?? getDomainColor(props.data.key))

	const displayName = computed(() =>
		props.data.key === OTHER_DOMAIN ? t('activityTracking.common.other') : props.data.label,
	)

	// The tooltip's headline — name and total time — plus the window, since a focused bar has no
	// tooltip. Interactive bars borrow the domain card's "View details for" verb so the two kinds of
	// chart control on one dashboard read as the same kind.
	const ariaLabel = computed(() => {
		const label = t('activityTracking.stackedBars.barLabel', {
			name: displayName.value,
			duration: fromSeconds(props.data.activeSeconds + props.data.backgroundSeconds),
			window: props.windowLabel,
		})
		return props.interactive ? t('activityTracking.statColumn.viewDetails', { domain: label }) : label
	})

	function onActivate() {
		if (props.interactive) emit('click')
	}

	const barContainerStyle = computed(() => ({
		gridColumn: `${props.gridColumnStart} / ${props.gridColumnEnd}`,
		gridRow: `${props.gridRowStart} / ${props.gridRowEnd}`,
		display: 'flex',
		flexDirection: 'column' as const,
	}))

	const activeMinutes = computed(() => props.data.activeMinutes)
	const backgroundMinutes = computed(() => props.data.backgroundMinutes)

	const activeStyle = computed(() => ({
		flex: `${activeMinutes.value} 0 0`,
		backgroundColor: domainColor.value,
		borderRadius: '0', // No bottom border radius
	}))

	const backgroundStyle = computed(() => ({
		flex: `${backgroundMinutes.value} 0 0`,
		background: `repeating-linear-gradient(
		45deg,
		${domainColor.value},
		${domainColor.value} 2px,
		${lightenColor(domainColor.value, 0.6)} 2px,
		${lightenColor(domainColor.value, 0.6)} 4px
	)`,
		borderRadius: '4px 4px 0 0', // Only top border radius
	}))
</script>

<style scoped>
	.bar-column {
		transition: opacity 0.15s;
		z-index: 5;
	}

	.bar-column--interactive {
		cursor: pointer;
	}

	.bar-column--interactive:hover {
		opacity: 0.85;
	}

	/* Keyboard focus only. Raised above the neighbouring columns' z-index: 5 so the ring is not
	   painted under the bar one gap over. */
	.bar-column:focus {
		outline: none;
	}

	.bar-column:focus-visible {
		outline: 2px solid rgb(var(--v-theme-secondary));
		outline-offset: 2px;
		z-index: 6;
	}

	.bar-segment {
		min-height: 1px;
	}
</style>

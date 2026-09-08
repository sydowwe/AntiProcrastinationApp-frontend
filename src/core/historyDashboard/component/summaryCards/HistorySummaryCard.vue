<template>
	<VCard
		class="summary-card"
		:class="{ 'summary-card--selected': selected }"
		:elevation="selected ? 6 : 2"
		tabindex="0"
		role="button"
		:aria-label="$t('historyDashboard.summaryCards.viewDetails', { name: card.name })"
		@click="emit('click', historyGroupKey(card))"
	>
		<VCardTitle class="text-center pb-2">
			<VTooltip
				:text="card.name"
				location="top"
			>
				<template #activator="{ props: tooltipProps }">
					<div
						v-bind="tooltipProps"
						class="card-name"
					>
						{{ card.name }}
					</div>
				</template>
			</VTooltip>
		</VCardTitle>
		<VCardText
			class="pa-0"
			style="background-color: rgba(var(--v-theme-on-surface), 0.05)"
		>
			<div class="stat-column">
				<div class="text-caption text-medium-emphasis mb-1">
					{{ $t('historyDashboard.summaryCards.total') }}
				</div>
				<div class="text-h6 font-weight-bold mb-1">{{ formattedTime }}</div>
				<div style="font-size: 0.85rem !important">
					<VChip
						v-if="card.isNew"
						size="x-small"
						color="primary"
						variant="flat"
						style="font-size: 0.7rem !important"
					>
						{{ $t('activityTracking.statColumn.new') }}
					</VChip>
					<div
						v-else-if="card.percentChange !== null"
						:class="comparisonClass"
						style="font-size: 0.85rem !important"
					>
						{{ comparisonText }}
					</div>
					<div
						v-else
						class="text-caption text-disabled"
					>
						-
					</div>
				</div>
			</div>
		</VCardText>
		<div
			class="color-bar"
			:style="{ backgroundColor: resolvedColor }"
		/>
	</VCard>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import type { HistorySummaryCard as HistorySummaryCardDto } from '@/core/historyDashboard/dto/response/HistorySummaryCard.ts'
	import { historyGroupKey, type HistoryGroupKey } from '@/core/historyDashboard/dto/HistoryGroupKey.ts'
	import { fromSeconds } from '@/_common/utils/formatDuration.ts'
	import { resolveHistoryGroupColor } from '@/core/historyDashboard/dto/historyGroupColor.ts'

	const props = defineProps<{
		card: HistorySummaryCardDto
		selected?: boolean
	}>()

	const emit = defineEmits<{
		click: [group: HistoryGroupKey]
	}>()

	const resolvedColor = computed(() => resolveHistoryGroupColor(props.card))
	const formattedTime = computed(() => fromSeconds(props.card.totalSeconds))

	const comparisonText = computed(() => {
		if (props.card.percentChange === null) return ''
		if (props.card.percentChange === 0) return '━ 0%'
		if (props.card.percentChange > 0) return `▲ ${Math.abs(props.card.percentChange)}%`
		return `▼ ${Math.abs(props.card.percentChange)}%`
	})

	const comparisonClass = computed(() => {
		if (props.card.percentChange === null) return ''
		if (props.card.percentChange === 0) return 'text-caption text-medium-emphasis'
		if (props.card.percentChange > 0) return 'text-caption text-success'
		return 'text-caption text-error'
	})
</script>

<style scoped>
	.summary-card {
		min-width: 160px;
		cursor: pointer;
		transition:
			transform 0.2s,
			box-shadow 0.2s;
	}

	.summary-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2) !important;
	}

	.summary-card--selected {
		border: 2px solid rgb(var(--v-theme-primary));
	}

	.card-name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 100%;
	}

	.stat-column {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: 12px 8px;
	}

	.color-bar {
		height: 4px;
		width: 100%;
	}
</style>

<template>
<VCard
	class="summary-card"
	:class="{'summary-card--selected': selected}"
	:elevation="selected ? 6 : 2"
	@click="emit('click', card.name)"
	tabindex="0"
	role="button"
	:aria-label="`View details for ${card.name}`"
>
	<VCardTitle class="text-center pb-2">
		<VTooltip :text="card.name" location="top">
			<template #activator="{props: tooltipProps}">
				<div v-bind="tooltipProps" class="card-name">{{ card.name }}</div>
			</template>
		</VTooltip>
	</VCardTitle>
	<VCardText class="pa-0" style="background-color: rgb(55,55,55)">
		<div class="stat-column">
			<div class="text-caption text-medium-emphasis mb-1">Total</div>
			<div class="text-h6 font-weight-bold mb-1">{{ formattedTime }}</div>
			<div style="font-size: 0.85rem!important;">
				<VChip
					v-if="card.isNew"
					size="x-small"
					color="info"
					variant="flat"
					style="font-size: 0.7rem!important;"
				>
					NEW
				</VChip>
				<div
					v-else-if="card.percentChange !== null"
					:class="comparisonClass"
					style="font-size: 0.85rem!important;"
				>
					{{ comparisonText }}
				</div>
				<div v-else class="text-caption text-disabled">-</div>
			</div>
		</div>
	</VCardText>
	<div class="color-bar" :style="{backgroundColor: resolvedColor}"/>
</VCard>
</template>

<script setup lang="ts">
import {computed} from 'vue'
import type {HistorySummaryCard as HistorySummaryCardDto} from '@/dtos/response/historyDashboard/HistorySummaryCard.ts'
import {formatDuration} from '@/utils/formatDuration.ts'
import {getDomainColor} from '@/utils/domainColor.ts'

const props = defineProps<{
	card: HistorySummaryCardDto
	selected?: boolean
}>()

const emit = defineEmits<{
	click: [name: string]
}>()

const resolvedColor = computed(() => props.card.color ?? getDomainColor(props.card.name))
const formattedTime = computed(() => formatDuration(props.card.totalSeconds))

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
	cursor: pointer;
	transition: transform 0.2s, box-shadow 0.2s;
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

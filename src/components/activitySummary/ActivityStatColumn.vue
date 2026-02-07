<template>
	<div class="stat-column">
		<div class="text-caption text-medium-emphasis mb-1">
			{{ label }}
		</div>
		<div class="text-h6 font-weight-bold mb-1">
			{{ formattedTime }}
		</div>
		<div class="comparison-indicator">
			<VChip
				v-if="isNew"
				size="small"
				color="info"
				variant="flat"
			>
				NEW
			</VChip>
			<div
				v-else-if="percentChange !== null"
				:class="comparisonClass"
				:aria-label="comparisonAriaLabel"
			>
				{{ comparisonText }}
			</div>
			<div v-else class="text-caption text-disabled">
				-
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { formatDuration } from '@/utils/formatDuration';

interface Props {
	label: string;
	seconds: number;
	percentChange: number | null;
	isNew: boolean;
}

const props = defineProps<Props>();

const formattedTime = computed(() => formatDuration(props.seconds));

const comparisonText = computed(() => {
	if (props.percentChange === null) return '';
	if (props.percentChange === 0) return '━ 0%';
	if (props.percentChange > 0) return `▲ ${Math.abs(props.percentChange)}%`;
	return `▼ ${Math.abs(props.percentChange)}%`;
});

const comparisonClass = computed(() => {
	if (props.percentChange === null) return '';
	if (props.percentChange === 0) return 'text-caption text-medium-emphasis';
	if (props.percentChange > 0) return 'text-caption text-success';
	return 'text-caption text-error';
});

const comparisonAriaLabel = computed(() => {
	if (props.percentChange === null) return '';
	if (props.percentChange === 0) return 'No change from average';
	if (props.percentChange > 0) {
		return `${Math.abs(props.percentChange)}% above average`;
	}
	return `${Math.abs(props.percentChange)}% below average`;
});
</script>

<style scoped>
.stat-column {
	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;
	padding: 8px;
	min-width: 80px;
}

.comparison-indicator {
	min-height: 24px;
	display: flex;
	align-items: center;
	justify-content: center;
}
</style>

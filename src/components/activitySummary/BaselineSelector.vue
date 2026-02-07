<template>
	<div class="d-flex align-center ga-2">
		<span class="text-body-2 text-medium-emphasis">Compared to:</span>
		<VSelect
			:modelValue="selectedBaseline"
			:items="options"
			itemValue="value"
			itemTitle="label"
			density="compact"
			variant="outlined"
			hideDetails
			@update:modelValue="handleChange"
			style="max-width: 200px;"
		/>
	</div>
</template>

<script setup lang="ts">
export type BaselineType = 'last7days' | 'last30days' | 'sameWeekday' | 'allTime';

export interface BaselineOption {
	value: BaselineType;
	label: string;
}

interface Props {
	selectedBaseline: BaselineType;
	options: BaselineOption[];
}

interface Emits {
	(e: 'update:selectedBaseline', value: BaselineType): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

function handleChange(value: BaselineType) {
	emit('update:selectedBaseline', value);
}
</script>

<style scoped>
</style>

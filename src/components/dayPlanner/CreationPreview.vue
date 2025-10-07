<!-- CreationPreview.vue -->
<template>
<div
	v-if="preview"
	class="creation-preview"
	:style="previewStyle"
>
	<span class="preview-time">{{ formattedTimeRange }}</span>
</div>
</template>

<script setup lang="ts">
import {computed} from 'vue'
import type {CreationPreviewType} from '@/classes/types/DayPlannerTypes'
import {useDayPlanner} from '@/components/dayPlanner/useDayPlanner.ts';

const {slotIndexToTime} = useDayPlanner()

const props = defineProps<{
	preview: CreationPreviewType | null
}>()

const previewStyle = computed(() => {
	if (!props.preview) return {}

	const startRow = props.preview.startRow
	const endRow = props.preview.endRow
	const span = Math.max(1, endRow - startRow + 1)

	return {
		gridRow: `${startRow} / span ${span}`
	}
})

const formattedTimeRange = computed(() => {
	if (!props.preview) return ''

	const startTime = slotIndexToTime.value(props.preview.startRow - 1)
	const endTime = slotIndexToTime.value(props.preview.endRow)

	return `${startTime} - ${endTime}`
})


</script>

<style scoped>
.creation-preview {
	position: absolute;
	top: 2px;
	bottom: 1px;
	left: 2px;
	right: 2px;
	background: rgba(66, 153, 225, 0.2);
	border: 2px dashed #4299e1;
	border-radius: 6px;
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 5;
	pointer-events: none;
}

.preview-time {
	font-size: 12px;
	font-weight: 500;
	color: #2c5282;
	background: white;
	padding: 2px 8px;
	border-radius: 4px;
}
</style>
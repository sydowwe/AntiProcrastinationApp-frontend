<template>
	<div
		v-if="visible && done !== null"
		class="d-flex align-center ga-3"
	>
		<VProgressLinear
			:modelValue="percent"
			color="successDark"
			height="6"
			rounded
			style="max-width: 160px"
		/>
		<span class="text-caption text-medium-emphasis">
			{{ $t(labelKey, { done, total }) }}
		</span>
	</div>
</template>

<script setup lang="ts">
	import { computed } from 'vue'

	const {
		done,
		total,
		visible,
		labelKey = 'leisure.experienced.progress',
	} = defineProps<{
		done: number | null
		total: number
		visible: boolean
		/** The backlog counts only its one-time half, so it says so rather than implying the whole table. */
		labelKey?: string
	}>()

	const percent = computed(() => (total > 0 && done !== null ? (done / total) * 100 : 0))
</script>

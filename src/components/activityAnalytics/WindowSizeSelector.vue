<template>
	<VSelect
		v-model="selectedSize"
		:items="formattedOptions"
		itemTitle="title"
		itemValue="value"
		density="compact"
		variant="outlined"
		hideDetails
		style="max-width: 100px"
		label="Window"
	/>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
	modelValue: number
	options: number[]
}>()

const emit = defineEmits<{
	(e: 'update:modelValue', value: number): void
}>()

const selectedSize = computed({
	get: () => props.modelValue,
	set: (val) => emit('update:modelValue', val),
})

const formattedOptions = computed(() =>
	props.options.map((mins) => ({
		value: mins,
		title: mins >= 60 ? `${mins / 60}h` : `${mins}m`,
	}))
)
</script>

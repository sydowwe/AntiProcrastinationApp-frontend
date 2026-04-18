<template>
	<VChip
		:size="size"
		:variant="variant"
		:color="colorComp"
	>
		<VIcon
			v-if="icon"
			:icon="icon"
			style="margin-right: 6px"
		/>
		<slot></slot>
	</VChip>
</template>

<script setup lang="ts">
	import { useColor } from '@/utils/colorPalette.ts'
	import { computed } from 'vue'

	const {
		color,
		variant = 'tonal',
		size = 'default',
	} = defineProps<{
		icon?: string
		color?: string
		size?: string
		variant?: 'text' | 'flat' | 'elevated' | 'outlined' | 'plain' | 'tonal'
	}>()

	const { getBgColor, getTextColor } = useColor()

	const colorComp = computed(() =>
		['tonal', 'outlined'].includes(variant) ? getTextColor(color) : getBgColor(color),
	)
</script>

<style scoped></style>

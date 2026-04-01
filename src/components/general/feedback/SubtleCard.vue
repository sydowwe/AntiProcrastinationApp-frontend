<template>
	<div
		class="pa-3 rounded-lg"
		:style="style"
	>
		<slot>
			<div
				class="w-100 d-flex align-center ga-2 mb-1"
				:class="{ 'text-overline': shortTitle, 'justify-center': titleCentered }"
			>
				<VIcon
					v-if="hasIcon"
					:icon="icon"
					size="16"
					:color
				/>
				<span :style="`color: rgb(var(--v-theme-${color}))`">{{ title }}</span>
			</div>
			<p
				class="text-body-2 text-white ma-0"
				style="white-space: pre-wrap"
			>
				{{ text }}
			</p>
		</slot>
	</div>
</template>

<script setup lang="ts">
	import { computed } from 'vue'

	const {
		color,
		borderOpacity = 'medium',
		title,
		shortTitle = false,
		titleCentered = false,
		text,
		hasIcon = false,
		icon,
	} = defineProps<{
		color: string
		borderOpacity?: 'low' | 'medium' | 'high'
		title?: string
		shortTitle?: boolean
		titleCentered?: boolean
		text?: string
		hasIcon?: boolean
		icon?: string
	}>()

	const borderOpacityVal = computed(() => {
		switch (borderOpacity) {
			case 'low':
				return 0.15
			case 'high':
				return 0.5
			default:
				return 0.33
		}
	})

	const style = computed(() => ({
		background: `rgba(var(--v-theme-${color}), 0.08)`,
		border: `1px solid rgba(var(--v-theme-${color}), ${borderOpacityVal.value})`,
	}))
</script>

<style scoped></style>

<template>
	<div class="d-flex flex-1-1 ga-1">
		<slot></slot>
		<VIconBtn
			v-if="showBtn"
			:icon
			:color
			:variant
			:height="btnHeight"
			@click="emit('create')"
		></VIconBtn>
	</div>
</template>

<script setup lang="ts">
	import { computed } from 'vue'

	const {
		showBtn,
		icon,
		color,
		variant = 'tonal',
		density = 'comfortable',
	} = defineProps<{
		showBtn: boolean
		icon: string
		color: string
		variant?: 'text' | 'flat' | 'tonal' | 'elevated' | 'outlined' | 'plain' | undefined
		density?: 'default' | 'comfortable' | 'compact' | undefined
	}>()

	const emit = defineEmits<{
		create: []
	}>()

	const btnHeight = computed(() => (density === 'compact' ? '40px' : '48px'))
</script>

<style scoped></style>

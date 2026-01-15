<template>
<div class="pa-3 rounded-lg" :style="style">
	<slot>
		<div class="d-flex align-center ga-2 text-overline mb-1">
			<VIcon :icon="icon" size="14" :color/>
			<span :style="`color: rgb(var(--v-theme-${color}))`">Notes</span>
		</div>
		<p class="text-body-2 text-white ma-0" style="white-space: pre-wrap">{{ text }}</p>
	</slot>
</div>
</template>

<script setup lang="ts">
import {computed} from 'vue';

const {color} = defineProps<{
	color: string,
	title?: string,
	text?: string,
	icon?: string,
}>()


const style = computed(() => ({
	background: `rgba(var(--v-theme-${color}), 0.08)`,
	border: `1px solid rgba(var(--v-theme-${color}), 0.15)`,
}))
</script>

<style scoped>
</style>
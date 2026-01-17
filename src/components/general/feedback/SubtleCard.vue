<template>
<div class="pa-3 rounded-lg" :style="style">
	<slot>
		<div class="w-100 d-flex align-center ga-2 mb-1" :class="{'text-overline': shortTitle, 'justify-center': titleCentered}">
			<VIcon :icon="icon" size="16" :color/>
			<span :style="`color: rgb(var(--v-theme-${color}))`">{{ title }}</span>
		</div>
		<p class="text-body-2 text-white ma-0" style="white-space: pre-wrap">{{ text }}</p>
	</slot>
</div>
</template>

<script setup lang="ts">
import {computed} from 'vue';

const {color} = defineProps({
	color: {
		type: String,
		required: true
	},
	title: {
		type: String,
	},
	shortTitle: {
		type: Boolean,
		default: false
	},
	titleCentered: {
		type: Boolean,
		default: false
	},
	text: {
		type: String,
	},
	icon: {
		type: String,
	}
})


const style = computed(() => ({
	background: `rgba(var(--v-theme-${color}), 0.08)`,
	border: `1px solid rgba(var(--v-theme-${color}), 0.15)`,
}))
</script>

<style scoped>
</style>
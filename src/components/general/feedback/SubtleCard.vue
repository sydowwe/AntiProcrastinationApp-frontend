<template>
<div class="pa-3 rounded-lg" :style="style">
	<slot>
		<div class="w-100 d-flex align-center ga-2 mb-1" :class="{'text-overline': shortTitle, 'justify-center': titleCentered}">
			<VIcon v-if="hasIcon" :icon="icon" size="16" :color/>
			<span :style="`color: rgb(var(--v-theme-${color}))`">{{ title }}</span>
		</div>
		<p class="text-body-2 text-white ma-0" style="white-space: pre-wrap">{{ text }}</p>
	</slot>
</div>
</template>

<script setup lang="ts">
import {computed} from 'vue';

const {color, borderOpacity} = defineProps({
	color: {
		type: String,
		required: true
	},
	borderOpacity: {
		type: String as () => 'low' | 'medium' | 'high',
		default: 'medium'
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
	hasIcon: Boolean,
	icon: {
		type: String,
	}
})

const borderOpacityVal = computed(() => {
	switch (borderOpacity) {
		case 'low':
			return 0.15;
		case 'medium':
			return 0.33;
		case 'high':
			return 0.5;
	}
})

const style = computed(() => ({
	background: `rgba(var(--v-theme-${color}), 0.08)`,
	border: `1px solid rgba(var(--v-theme-${color}), ${borderOpacityVal.value})`,
}))
</script>

<style scoped>
</style>
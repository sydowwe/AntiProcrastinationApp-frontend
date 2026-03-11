<template>
<div class="d-flex flex-1-1 ga-1">
	<slot></slot>
	<VIconBtn :icon :color :variant @click="emit('create')" :height="btnHeight"></VIconBtn>
</div>
</template>

<script setup lang="ts">
import {computed} from 'vue';

const props = defineProps({
	icon: {
		type: String,
		required: true,
	},
	color: {
		type: String,
		required: true,
	},
	variant: {
		type: String as () => "text" | "flat" | "tonal" | "elevated" | "outlined" | "plain" | undefined,
		default: 'tonal',
	},
	density: {
		type: String as () => "default" | "comfortable" | "compact" | undefined,
		default: 'comfortable',
	}
});

const btnHeight = computed(() => (props.density === 'compact' ? '40px' : '48px'));

const emit = defineEmits(['create']);
</script>

<style scoped>

</style>
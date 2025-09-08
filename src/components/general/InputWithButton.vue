<template>
<div class="d-flex ga-1">
	<slot></slot>
	<VIconBtn :icon :color :variant @click="emit('create')"></VIconBtn>
</div>
</template>

<script setup lang="ts">
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
		type: String as () =>"text" | "flat" | "tonal" | "elevated" | "outlined" | "plain" | undefined,
		default: 'tonal',
	}
});

const emit = defineEmits(['create']);
</script>

<style scoped>

</style>
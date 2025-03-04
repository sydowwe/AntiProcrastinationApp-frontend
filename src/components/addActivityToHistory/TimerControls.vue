<template>
<div class="d-flex justify-center ga-3">
	<VBtn size="large" color="success" @click="emit('start')" :disabled="intervalId !== null && !paused">{{$t('controls.start')}}</VBtn>
	<VBtn size="large" color="info" @click="emit('pause')" :disabled="intervalId === null || paused">{{$t('controls.pause')}}</VBtn>
	<VBtn size="large" color="error" @click="emit('stop')" :disabled="intervalId === null">{{$t('controls.stop')}}</VBtn>
	<slot></slot>
</div>
</template>
<script setup lang="ts">
const emit = defineEmits(["start", "stop", "pause"]);
defineProps({
	intervalId: {
		type: [Number, null],
		required: true,
	},
	paused: {
		type: Boolean,
		required: true,
	},
})
</script>
<style scoped>

</style>
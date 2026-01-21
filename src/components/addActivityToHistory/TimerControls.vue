<template>
<div class="d-flex justify-center ga-3">
	<VBtn size="large" color="successDark" @click="emit('start')" :disabled="!!intervalId && !paused">{{ $t('controls.start') }}</VBtn>
	<VBtn size="large" color="primary" @click="emit('pause')" :disabled="!intervalId || paused">{{ $t('controls.pause') }}</VBtn>
	<VBtn size="large" color="errorDark" @click="emit('stop')" :disabled="!intervalId">{{ $t('controls.stop') }}</VBtn>
	<slot></slot>
</div>
</template>
<script setup lang="ts">

const emit = defineEmits(["start", "stop", "pause"]);
defineProps<{
	intervalId: number | undefined
	paused: boolean
}>()
</script>
<style scoped>

</style>
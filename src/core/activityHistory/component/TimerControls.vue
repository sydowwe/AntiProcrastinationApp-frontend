<template>
	<div class="d-flex justify-center ga-3">
		<VBtn
			size="large"
			prependIcon="play"
			color="successDark"
			:disabled="!!intervalId && !paused"
			@click="emit('start')"
		>
			{{ $t('controls.start') }}
		</VBtn>
		<VBtn
			size="large"
			prependIcon="pause"
			color="primary"
			:disabled="!intervalId || paused"
			@click="emit('pause')"
		>
			{{ $t('controls.pause') }}
		</VBtn>
		<VBtn
			size="large"
			prependIcon="stop"
			color="errorDark"
			:disabled="!intervalId"
			@click="emit('stop')"
		>
			{{ $t('controls.stop') }}
		</VBtn>
		<slot></slot>
	</div>
</template>
<script setup lang="ts">
	defineProps<{
		intervalId: number | undefined
		paused: boolean
	}>()
	const emit = defineEmits<{
		start: []
		stop: []
		pause: []
	}>()
</script>
<style scoped></style>

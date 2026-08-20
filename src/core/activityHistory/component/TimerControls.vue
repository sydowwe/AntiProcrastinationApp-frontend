<template>
	<div class="d-flex justify-center ga-3">
		<VBtn
			size="large"
			prependIcon="play"
			color="successDark"
			:disabled="running && !paused"
			@click="emit('start')"
		>
			{{ $t('controls.start') }}
		</VBtn>
		<VBtn
			size="large"
			prependIcon="pause"
			color="primary"
			:disabled="!running || paused"
			@click="emit('pause')"
		>
			{{ $t('controls.pause') }}
		</VBtn>
		<VBtn
			size="large"
			prependIcon="stop"
			color="errorDark"
			:disabled="!running"
			@click="emit('stop')"
		>
			{{ $t('controls.stop') }}
		</VBtn>
		<slot></slot>
	</div>
</template>
<script setup lang="ts">
	defineProps<{
		/**
		 * Whether a session exists at all — paused counts. This used to be the `setInterval` handle
		 * of whichever view mounted the controls, which meant "is stopping possible" was answered by
		 * whether a rendering timer happened to be live: pausing the countdown cleared its handle and
		 * disabled Stop, so a paused timer could not be stopped at all.
		 */
		running: boolean
		paused: boolean
	}>()
	const emit = defineEmits<{
		start: []
		stop: []
		pause: []
	}>()
</script>
<style scoped></style>

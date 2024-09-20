<template>
<div class="d-flex justify-center ga-3">
	<VBtn size="large" color="success" @click="emit('start')" :disabled="intervalId !== null && !paused">{{i18n.t('controls.start')}}</VBtn>
	<VBtn size="large" color="info" @click="emit('pause')" :disabled="intervalId === null || paused">{{i18n.t('controls.pause')}}</VBtn>
	<VBtn size="large" color="error" @click="emit('stop')" :disabled="intervalId === null">{{i18n.t('controls.stop')}}</VBtn>
	<slot></slot>
</div>
</template>
<script setup lang="ts">
import {useI18n} from 'vue-i18n';
const i18n = useI18n();
const emit = defineEmits(["start", "stop", "pause"]);
const props = defineProps({
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
<template>
<VProgressCircular :model-value="timerProgress"
                   class="reversed-v-progress-circular mx-auto mb-4"
                   size="400"
                   width="30"
                   rotate="360"
                   :color="color"
>
	<div class="d-flex flex-column">
		<TimeDisplay :whatToShow="whatToShow" :timeObject="timeRemainingObject"></TimeDisplay>
		<h1 class="text-white font-weight-bold text-center" v-if="title" style="line-height: 2.7rem">{{ title }}</h1>
	</div>
</VProgressCircular>
</template>
<script setup lang="ts">
import TimeDisplay from '@/components/general/dateTime/TimeDisplay.vue';
import {computed} from 'vue';
import {Time} from '@/utils/Time.ts';
import {TimePrecise, type TimePreciseKeys} from '@/utils/TimePrecise.ts';

const props = defineProps({
	color: {
		type: String,
		default: 'primary-accent',
	},
	title: {
		type: String,
	},
	timeInitialObject: {
		type: Time,
		required: true,
	},
	timeRemainingObject: {
		type: TimePrecise,
		required: true,
	},
	whatToShow: {
		type: Array as () => TimePreciseKeys[],
		default: () => ['hours', 'minutes', 'seconds'],
	}
});

const timerProgress = computed(() => {
	return props.timeRemainingObject?.getInSeconds / props.timeInitialObject?.getInSeconds * 100;
})
</script>
<style scoped>
.reversed-v-progress-circular {
	transform: scaleX(-1);
}

.reversed-v-progress-circular :deep(.v-progress-circular__content) {
	transform: scaleX(-1);
}
</style>
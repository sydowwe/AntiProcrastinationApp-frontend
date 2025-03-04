<template>
<VProgressCircular :model-value="timerProgress"
                   size="400"
                   width="30"
                   :color="color"
                   class="mx-auto mb-4"
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
import {TimeLengthKeys, TimeLengthObject} from '@/classes/TimeUtils';

const props = defineProps({
	color: {
		type: String,
		default: 'primary',
	},
	title: {
		type: String,
	},
	timeInitialObject: {
		type: TimeLengthObject,
		required: true,
	},
	timeRemainingObject: {
		type: TimeLengthObject,
		required: true,
	},
	whatToShow: {
		type: Array as () => TimeLengthKeys[],
		default: () => ['hours', 'minutes', 'seconds'],
	}
});

const timerProgress = computed(() => {
	return props.timeRemainingObject?.getInSeconds / props.timeInitialObject?.getInSeconds * 100;
})
</script>
<style scoped>

</style>
<template>
<VProgressCircular :model-value="timerProgress"
                   size="400"
                   width="30"
                   :color="color"
                   class="mx-auto mb-4"
>
	<TimeDisplay :whatToShow="whatToShow" :timeObject="timeRemainingObject"></TimeDisplay>
</VProgressCircular>
</template>
<script setup lang="ts">
import TimeDisplay from '@/components/TimeDisplay.vue';
import {computed} from 'vue';
import {TimeLengthObject} from '@/classes/TimeUtils';

const props = defineProps({
	color: {
		type: String,
		default: 'primary',
	},
	timeInitialObject: {
		type: TimeLengthObject,
		required: true,
	},
	timeRemainingObject: {
		type: TimeLengthObject,
		required: true,
	},
	whatToShow:{
		type: Array as () => TimeLengthKeys[],
		default: () => ['hours', 'minutes', 'seconds'],
	}
});

const timerProgress = computed(() => {
	return Math.floor(props.timeRemainingObject?.getInSeconds / props.timeInitialObject?.getInSeconds * 100);
})
</script>
<style scoped>

</style>
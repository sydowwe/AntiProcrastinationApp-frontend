<template>
	<VProgressCircular
		:modelValue="timerProgress"
		class="reversed-v-progress-circular mx-auto mb-4"
		size="400"
		width="30"
		rotate="360"
		:color="color"
	>
		<div class="d-flex flex-column">
			<TimeDisplay
				:whatToShow="whatToShow"
				:timeObject="timeRemainingObject"
			></TimeDisplay>
			<h2
				v-if="title"
				class="text-white font-weight-bold text-center text-wrap"
				style="max-width: 300px"
			>
				{{ title }}
			</h2>
		</div>
	</VProgressCircular>
</template>
<script setup lang="ts">
	import TimeDisplay from '@/components/general/dateTime/TimeDisplay.vue'
	import { computed } from 'vue'
	import type { Time } from '@/dtos/dto/Time.ts'
	import type { TimePrecise } from '@/dtos/dto/TimePrecise.ts'
	import { type TimePreciseKeys } from '@/dtos/dto/TimePrecise.ts'

	const {
		title,
		timeInitialObject,
		timeRemainingObject,
		color = 'primary-accent',
		whatToShow = ['hours', 'minutes', 'seconds'] as TimePreciseKeys[],
	} = defineProps<{
		title: string
		timeInitialObject: Time
		timeRemainingObject: TimePrecise
		color?: string
		whatToShow?: TimePreciseKeys[]
	}>()

	const timerProgress = computed(() => {
		return (timeRemainingObject?.getInSeconds / timeInitialObject?.getInSeconds) * 100
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

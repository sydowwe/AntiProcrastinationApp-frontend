<template>
<VRow align="center" justify="center" noGutters>
	<VCol :cols="12 / whatToShow.length" v-for="field in whatToShow" :key="field">
		<VSheet color="secondary-container" class="time-card pa-3 text-center">
			<div class="time-label">{{ timeLabels[field as keyof typeof timeLabels] }}</div>
			<div class="time-value">{{ formatTime(timeObject[field] as number) }}</div>
		</VSheet>
	</VCol>
</VRow>
</template>

<script setup lang="ts">

import {TimePrecise, type TimePreciseKeys} from '@/utils/TimePrecise.ts';

const props = defineProps({
	timeObject: {
		type: TimePrecise,
		required: true,
	},
	whatToShow: {
		type: Array as () => TimePreciseKeys[],
		default: () => ['hours', 'minutes', 'seconds'],
	}
});
console.log(props.timeObject);
const timeLabels = {
	hours: 'H',
	minutes: 'M',
	seconds: 'S',
};

function formatTime(time: number) {
	if (isNaN(time) || time < 0) {
		return '00';
	}
	return Math.floor(time).toString().padStart(2, '0');
}
</script>

<style scoped>
.time-card {
	color: white;
	border-radius: 8px;
	margin: 0.4rem;
}

.time-value {
	font-size: 3.4rem;
	font-weight: bold;
	line-height: 3rem;
}

.time-label {
	font-size: 1.7rem;
	line-height: 1.5rem;
}
</style>

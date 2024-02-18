<template>
		<div class="d-flex align-center ga-2">
				<VTextField :label="$t('dateTime.hours')" v-model="time.hours" type="number" min="0" max="24" :clearable="false"
				            hide-details></VTextField>
				<span style="font-size: x-large">:</span>
				<VTextField :label="$t('dateTime.minutes')" v-model="time.minutes" type="number" min="0" max="59"
				            :clearable="false"
				            hide-details></VTextField>
		</div>
</template>
<script setup lang="ts">
		import {ref} from 'vue';
		import {TimeObject} from '@/classes/TimeUtils';

		const time = ref(new TimeObject());
		defineExpose({time});
</script>
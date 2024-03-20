<template>
	<div class="d-flex ga-2">
		<VTextField v-model="time.hours" type="number" min="0" max="24" suffix="H" :clearable="false" hide-details></VTextField>
		<span style="font-size: xx-large;line-height: 1.2">:</span>
		<VTextField v-model="time.minutes" type="number" min="0" max="59" suffix="M" :clearable="false" hide-details></VTextField>
		<span style="font-size: xx-large;line-height: 1.2">:</span>
		<VTextField v-model="time.seconds" type="number" min="0" max="59" suffix="S" :clearable="false" hide-details></VTextField>
	</div>
</template>
<script setup lang="ts">
    import { ref } from 'vue';
    import { TimeLengthObject } from '@/classes/TimeUtils';

    const time = ref(new TimeLengthObject());
    defineExpose({time});
</script>

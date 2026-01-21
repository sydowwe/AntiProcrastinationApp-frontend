<template>
<div class="d-flex ga-9">
	<TimePicker v-model="time" viewMode="second"></TimePicker>
	<VTimePicker v-model="str" viewMode="second" variant="input"></VTimePicker>
</div>
</template>

<script setup lang="ts">
import TimePicker from '@/components/general/dateTime/TimePicker.vue';
import {Time} from '@/utils/Time.ts';
import {ref, watch} from 'vue';

const time = ref(new Time())
const str = ref('')

watch(str, (newVal) => {
	console.log('str changed to:', newVal)
})
</script>
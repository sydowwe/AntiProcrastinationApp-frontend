<template>
	<div class="d-flex align-center ga-3">
		<VSwitch
			v-model="enabled"
			:label="$t('toDoList.suggestedTime')"
			color="primaryOutline"
			hideDetails
		/>
		<TimePicker
			v-if="enabled"
			v-model="timeValue"
			:label="$t('toDoList.suggestedTime')"
			viewMode="minute"
			hideDetails
			allowedMinutesSelected="1"
			style="min-width: 140px"
		/>
	</div>
</template>

<script setup lang="ts">
	import { ref, watch } from 'vue'
	import { Time } from '@/dtos/dto/Time.ts'
	import TimePicker from '@/components/general/dateTime/TimePicker.vue'

	const model = defineModel<Time | null>({ default: null })
	const enabled = ref(model.value !== null)
	const timeValue = ref<Time>(model.value ?? new Time())

	watch(model, newVal => {
		enabled.value = newVal !== null
		if (newVal !== null) timeValue.value = newVal
	})

	watch(enabled, newVal => {
		model.value = newVal ? timeValue.value : null
	})

	watch(timeValue, newVal => {
		if (enabled.value) model.value = newVal
	})
</script>

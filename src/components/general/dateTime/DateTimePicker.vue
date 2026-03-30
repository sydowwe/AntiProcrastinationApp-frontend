<template>
	<div class="d-flex">
		<VDateInput
			v-model="date"
			class="date-time-datePicker"
			:label="label ?? $t('dateTime.date')"
			:clearable="dateClearable"
			persistentClear
			:min="minDate"
			:max="maxDate"
			:density
			hideDetails
			minWidth="150px"
			maxWidth="150px"
			prependInnerIcon="far fa-calendar"
		></VDateInput>
		<TimePicker
			v-model="time"
			class="date-time-timePicker"
			:label="label ? '' : $t('dateTime.time')"
			:density
			minWidth="100px"
			maxWidth="100px"
			hideDetails
		></TimePicker>
	</div>
</template>
<script setup lang="ts">
	import { nextTick, ref, watch } from 'vue'
	import { VDateInput } from 'vuetify/labs/components'
	import { Time } from '@/dtos/dto/Time.ts'
	import TimePicker from '@/components/general/dateTime/TimePicker.vue'

	withDefaults(
		defineProps<{
			label: string
			density?: 'compact' | 'comfortable' | 'default'
			dateClearable?: boolean
			dateShowArrows?: boolean
			maxDate?: Date | null
			minDate?: Date | null
			timeShowArrows?: boolean
		}>(),
		{
			density: 'comfortable',
			dateClearable: true,
			dateShowArrows: true,
			maxDate: null,
			minDate: null,
			timeShowArrows: true,
		},
	)

	const model = defineModel<Date | null>()

	// Initialize internal state from model
	const date = ref<Date | null>(model.value ? new Date(model.value) : null)
	const time = ref<Time>(new Time())

	let isUpdatingFromModel = false

	// Update model when date changes
	watch(date, () => {
		if (isUpdatingFromModel) return
		updateModel()
	})

	// Update model when time changes
	watch(
		time,
		() => {
			if (isUpdatingFromModel) return
			updateModel()
		},
		{ deep: true },
	)

	function updateModel() {
		if (!date.value) {
			model.value = null
			return
		}

		const combined = new Date(date.value)
		combined.setHours(time.value.hours, time.value.minutes, 0, 0)
		model.value = combined
	}

	// Update internal state when model changes from parent
	watch(model, newModel => {
		isUpdatingFromModel = true

		if (!newModel) {
			date.value = null
			time.value = new Time()
		} else {
			date.value = new Date(newModel)
			time.value = new Time(newModel.getHours(), newModel.getMinutes())
		}

		nextTick(() => {
			isUpdatingFromModel = false
		})
	})
</script>
<style scoped>
	.date-time-datePicker:deep(.v-field) {
		border-bottom-right-radius: 0 !important;
		border-top-right-radius: 0 !important;
	}

	.date-time-timePicker:deep(.v-field) {
		border-bottom-left-radius: 0 !important;
		border-top-left-radius: 0 !important;
	}
</style>

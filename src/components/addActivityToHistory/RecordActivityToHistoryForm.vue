<template>
	<div class="mx-auto d-flex ga-6">
		<VForm class="d-flex flex-column align-start ga-3">
			<DateTimePicker
				v-model="dateTime"
				class="mb-auto"
				:label="$t('dateTime.when')"
				:dateClearable="false"
			></DateTimePicker>

			<TimePicker
				v-model="timeLength"
				icon="hourglass-end"
				:label="i18n.t('dateTime.length')"
				minWidth="150px"
				maxWidth="150px"
				hideDetails
			></TimePicker>
		</VForm>
	</div>
</template>

<script setup lang="ts">
	import DateTimePicker from '@/components/general/dateTime/DateTimePicker.vue'
	import TimePicker from '@/components/general/dateTime/TimePicker.vue'
	import { useI18n } from 'vue-i18n'
	import { ref } from 'vue'
	import { Time } from '@/dtos/dto/Time.ts'

	defineProps<{
		activityId: number
		activityName: string
	}>()

	const i18n = useI18n()

	const dateTime = ref<Date | null>(new Date())
	const timeLength = ref(new Time())
</script>

<style scoped></style>

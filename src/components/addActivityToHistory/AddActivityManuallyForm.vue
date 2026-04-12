<template>
	<div class="d-flex flex-column ga-3">
		<ActivitySelectionForm
			ref="activitySelectionForm"
			v-model:activityId="preselectedActivityId"
			:formDisabled
		></ActivitySelectionForm>
		<div class="mx-auto d-flex flex-wrap ga-4">
			<DateTimePicker
				v-model="dateTime"
				class="mb-auto flex-grow-1"
				:label="$t('dateTime.when')"
				:dateClearable="false"
			></DateTimePicker>
			<TimePicker
				v-model="timeLength"
				icon="hourglass-end"
				:label="i18n.t('dateTime.length')"
				hideDetails
			></TimePicker>
		</div>
	</div>
</template>

<script setup lang="ts">
	import ActivitySelectionForm from '@/components/ActivitySelectionForm.vue'
	import DateTimePicker from '@/components/general/dateTime/DateTimePicker.vue'
	import { onMounted, ref } from 'vue'
	import { Time } from '@/dtos/dto/Time.ts'
	import { useI18n } from 'vue-i18n'
	import { useSnackbar } from '@/composables/general/SnackbarComposable.ts'
	import TimePicker from '@/components/general/dateTime/TimePicker.vue'

	const {
		formDisabled,
		initialActivityId,
		initialDateTime,
		initialLength,
	} = defineProps<{
		formDisabled?: boolean
		initialActivityId?: number
		initialDateTime?: Date
		initialLength?: Time
	}>()

	const emit = defineEmits<{
		saved: []
	}>()

	const { showErrorSnackbar } = useSnackbar()
	const i18n = useI18n()

	const activitySelectionForm = ref<InstanceType<typeof ActivitySelectionForm>>()
	const dateTime = ref<Date | null>(new Date())
	const timeLength = ref(new Time())
	const preselectedActivityId = ref<number | null>(initialActivityId ?? null)

	onMounted(() => {
		if (initialDateTime) dateTime.value = initialDateTime
		if (initialLength) timeLength.value = initialLength
	})

	function saveActivity() {
		if (activitySelectionForm.value?.validate()) {
			if (dateTime.value) {
				if (timeLength.value.isNotZero()) {
					activitySelectionForm.value?.saveActivityToHistory(dateTime.value, timeLength.value)
					emit('saved')
				} else {
					showErrorSnackbar(i18n.t('history.lengthNotSet'))
				}
			} else {
				showErrorSnackbar(i18n.t('date.selectDatePlease'))
			}
		}
	}

	defineExpose({
		saveActivity,
		getValues: () => ({ dateTime: dateTime.value, timeLength: timeLength.value }),
	})
</script>

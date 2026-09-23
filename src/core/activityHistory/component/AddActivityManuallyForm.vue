<template>
	<div class="d-flex flex-column ga-3">
		<ActivitySelectionForm
			ref="activitySelectionForm"
			v-model:activityId="preselectedActivityId"
			v-model:selection="selection"
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
				allowedMinutesSelected="1"
				hideDetails
			></TimePicker>
		</div>
	</div>
</template>

<script setup lang="ts">
	import ActivitySelectionForm from '@/core/activity/component/ActivitySelectionForm.vue'
	import DateTimePicker from '@/_common/component/dateTime/DateTimePicker.vue'
	import { onMounted, ref } from 'vue'
	import { Time } from '@/_common/dto/dto/Time.ts'
	import { useI18n } from 'vue-i18n'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
	import TimePicker from '@/_common/component/dateTime/TimePicker.vue'
	import { useSaveActivityToHistory } from '@/core/activityHistory/composable/useSaveActivityToHistory.ts'
	import type { ActivitySelection } from '@/core/activity/dto/dto/ActivitySelection.ts'

	const { formDisabled, initialActivityId, initialDateTime, initialLength } = defineProps<{
		formDisabled?: boolean
		initialActivityId?: number
		initialDateTime?: Date
		initialLength?: Time
	}>()

	const emit = defineEmits<{
		saved: []
	}>()

	const { showErrorSnackbar } = useSnackbar()
	const { saveActivityToHistory } = useSaveActivityToHistory()
	const i18n = useI18n()

	const activitySelectionForm = ref<InstanceType<typeof ActivitySelectionForm>>()
	const dateTime = ref<Date | null>(new Date())
	const timeLength = ref(new Time())
	const preselectedActivityId = ref<number | null>(initialActivityId ?? null)
	const selection = ref<ActivitySelection | null>(null)

	onMounted(() => {
		if (initialDateTime) dateTime.value = initialDateTime
		if (initialLength) timeLength.value = initialLength
	})

	async function saveActivity(): Promise<boolean> {
		const errors = await activitySelectionForm.value?.validate()
		if (errors && errors.length > 0) return false
		if (!dateTime.value) {
			showErrorSnackbar(i18n.t('history.selectDatePlease'))
			return false
		}
		if (!timeLength.value.isNotZero()) {
			showErrorSnackbar(i18n.t('history.lengthNotSet'))
			return false
		}
		const newId = await saveActivityToHistory(
			preselectedActivityId.value,
			selection.value?.activityName ?? '',
			dateTime.value,
			timeLength.value,
		)
		if (!newId) return false
		resetAfterSave()
		emit('saved')
		return true
	}

	// The server's unique (activity, start) index refuses a second save at the same "when", so the
	// start must move on. It moves to the end of the span just saved rather than to now, so logging
	// several back-to-back spans needs only a new length each time. The activity is kept for the same
	// reason (F68).
	function resetAfterSave() {
		if (dateTime.value) {
			dateTime.value = new Date(dateTime.value.getTime() + timeLength.value.getInSeconds * 1000)
		}
		timeLength.value = new Time()
	}

	defineExpose({
		saveActivity,
		getValues: () => ({ dateTime: dateTime.value, timeLength: timeLength.value }),
	})
</script>

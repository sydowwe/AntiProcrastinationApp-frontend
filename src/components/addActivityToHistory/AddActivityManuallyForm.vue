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

	async function saveActivity(): Promise<boolean> {
		const errors = await activitySelectionForm.value?.validate()
		if (errors && errors.length > 0) return false
		if (!dateTime.value) {
			showErrorSnackbar(i18n.t('date.selectDatePlease'))
			return false
		}
		if (!timeLength.value.isNotZero()) {
			showErrorSnackbar(i18n.t('history.lengthNotSet'))
			return false
		}
		await activitySelectionForm.value?.saveActivityToHistory(dateTime.value, timeLength.value)
		emit('saved')
		return true
	}

	defineExpose({
		saveActivity,
		getValues: () => ({ dateTime: dateTime.value, timeLength: timeLength.value }),
	})
</script>

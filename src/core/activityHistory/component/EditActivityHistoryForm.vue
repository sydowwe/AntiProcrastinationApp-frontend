<template>
	<div class="d-flex flex-column ga-4 pa-4">
		<DateTimePicker
			v-model="startTimestamp"
			:label="$t('dateTime.when')"
			:dateClearable="false"
		/>
		<TimePicker
			v-model="length"
			icon="hourglass-end"
			:label="$t('dateTime.length')"
			minWidth="150px"
			maxWidth="150px"
			hideDetails
		/>
		<ActivitySelectionForm
			v-model:activityId="activityId"
			layout="dialog"
			:showFromToDoListField="false"
		/>
	</div>
</template>

<script setup lang="ts">
	import { ref } from 'vue'
	import type { ActivityHistory } from '@/core/activityHistory/dto/response/ActivityHistory.ts'
	import { Time } from '@/_common/dto/dto/Time.ts'
	import { useActivityHistoryCrud } from '@/core/activityHistory/api/activityHistoryApi.ts'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
	import { useDialogApi } from '@/_common/composable/general/useDialog.ts'
	import DateTimePicker from '@/_common/component/dateTime/DateTimePicker.vue'
	import TimePicker from '@/_common/component/dateTime/TimePicker.vue'
	import ActivitySelectionForm from '@/core/activity/component/ActivitySelectionForm.vue'
	import { ActivityHistoryRequest } from '@/core/activityHistory/dto/request/ActivityHistoryRequest.ts'

	const { record } = defineProps<{ record: ActivityHistory }>()

	const dialogApi = useDialogApi<boolean>()
	const { update } = useActivityHistoryCrud()
	const { showSuccessSnackbar, showErrorSnackbar } = useSnackbar()

	const startTimestamp = ref(new Date(record.startTimestamp))
	const length = ref(new Time(record.length.hours, record.length.minutes))
	const activityId = ref<number | null>(record.activity.id)

	dialogApi.onConfirm(onConfirm)

	async function onConfirm() {
		if (!startTimestamp.value || !activityId.value) return
		dialogApi.setLoading(true)
		try {
			await update(record.id, new ActivityHistoryRequest(startTimestamp.value, length.value, activityId.value))
			showSuccessSnackbar('Activity history updated')
			dialogApi.close(true)
		} catch {
			showErrorSnackbar('Failed to update activity history')
		} finally {
			dialogApi.setLoading(false)
		}
	}
</script>

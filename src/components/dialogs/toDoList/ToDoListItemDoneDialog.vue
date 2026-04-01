<template>
	<MyDialog
		v-model="dialogShown"
		title=""
		eager
		isSmall
		@confirmed="save"
	>
		<template #title>
			<span class="text-wrap">
				{{ i18n.t('toDoList.saveTask') }}
				<span class="text-purple-accent-4 font-weight-bold">{{ toDoListItem?.activity?.name }}</span>
				{{ i18n.t('history.toHistory').toLowerCase() }}?
			</span>
		</template>
		<VForm
			class="d-flex flex-column flex-md-row align-center ga-4 ga-md-6 pt-3"
			@keyup.enter="save"
		>
			<DateTimePicker
				v-model="dateTime"
				class="mb-auto"
				:label="$t('dateTime.when')"
				:dateClearable="false"
			></DateTimePicker>

			<TimePicker
				v-model="length"
				icon="hourglass-end"
				:label="i18n.t('dateTime.length')"
				minWidth="150px"
				maxWidth="150px"
				viewMode="minute"
				hideDetails
			></TimePicker>
		</VForm>
	</MyDialog>
</template>
<script setup lang="ts">
	import { ref, watch } from 'vue'
	import { Time } from '@/dtos/dto/Time.ts'

	import { useI18n } from 'vue-i18n'
	import MyDialog from '@/components/dialogs/MyDialog.vue'
	import DateTimePicker from '@/components/general/dateTime/DateTimePicker.vue'
	import { useSnackbar } from '@/composables/general/SnackbarComposable.ts'
	import { useActivityHistoryCrud } from '@/api/activityHistory/activityHistoryApi.ts'
	import type { IBaseToDoListItem } from '@/dtos/response/interface/IBaseToDoListItem.ts'
	import TimePicker from '@/components/general/dateTime/TimePicker.vue'

	const props = defineProps<{
		toDoListItem: IBaseToDoListItem
		isRecursive: boolean
	}>()
	const emit = defineEmits<{
		openNext: []
	}>()
	const dialogShown = defineModel<boolean>({ required: true })
	const { create } = useActivityHistoryCrud()
	const i18n = useI18n()
	const { showErrorSnackbar, showSuccessSnackbar } = useSnackbar()
	const dateTime = ref(new Date())
	const length = ref(new Time())

	watch(dialogShown, isShown => {
		if (isShown) {
			if (!props.isRecursive) {
				dateTime.value = new Date()
				console.log(dateTime.value)
			}
		} else {
			if (props.isRecursive) {
				setTimeout(() => emit('openNext'), 200)
			}
			length.value = new Time()
		}
	})

	async function save() {
		const request = await create(dateTime.value, length.value, props.toDoListItem?.activity.id)
		if (request) {
			showSuccessSnackbar(`Saved done to-do list task ${props.toDoListItem?.activity.name} to history`)
			dialogShown.value = false
		} else {
			showErrorSnackbar(`Error saving to-do list task ${props.toDoListItem?.activity.name} to history`)
		}
	}

	watch(dateTime, newVal => {
		console.log(newVal)
	})
</script>
<style scoped></style>

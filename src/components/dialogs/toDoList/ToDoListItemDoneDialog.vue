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
			ref="form"
			class="d-flex flex-column flex-md-row align-start ga-4 ga-md-6 pt-3"
			validateOn="submit"
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
				:rules="[lengthNotZeroRule]"
				showArrows
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
	import { VForm } from 'vuetify/components'

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
	const form = ref<InstanceType<typeof VForm>>()
	const dateTime = ref(new Date())
	const length = ref(new Time())

	function lengthNotZeroRule(value: unknown) {
		if (typeof value === 'string' && Time.fromString(value).isNotZero()) return true
		return i18n.t('dateTime.lengthRequired')
	}

	watch(length, () => {
		form.value?.resetValidation()
	})

	watch(dialogShown, isShown => {
		if (isShown) {
			if (!props.isRecursive) {
				dateTime.value = new Date()
			}
			length.value = props.toDoListItem?.suggestedTime ?? new Time()
		} else {
			if (props.isRecursive) {
				setTimeout(() => emit('openNext'), 200)
			}
			length.value = new Time()
		}
	})

	async function save() {
		const isValid = await form.value?.validate()
		if (!isValid?.valid) return
		const request = await create(dateTime.value, length.value, props.toDoListItem?.activity.id)
		if (request) {
			showSuccessSnackbar(i18n.t('toDoList.savedToHistory', { name: props.toDoListItem?.activity.name }))
			dialogShown.value = false
		} else {
			showErrorSnackbar(i18n.t('toDoList.errorSavingToHistory', { name: props.toDoListItem?.activity.name }))
		}
	}
</script>
<style scoped></style>

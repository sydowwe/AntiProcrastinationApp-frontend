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
				{{ $t('toDoList.saveTask') }}
				<span class="text-purple-accent-4 font-weight-bold">{{ toDoListItem?.activity?.name }}</span>
				{{ $t('history.toHistory').toLowerCase() }}?
			</span>
		</template>
		<LogTimeForm
			ref="logTimeForm"
			v-model:dateTime="dateTime"
			v-model:length="length"
			class="pt-3"
			@submit="save"
		/>
	</MyDialog>
</template>

<script setup lang="ts">
	import { ref, watch } from 'vue'
	import { Time } from '@/dtos/dto/Time.ts'
	import { useI18n } from 'vue-i18n'
	import MyDialog from '@/components/dialogs/MyDialog.vue'
	import LogTimeForm from '@/components/general/LogTimeForm.vue'
	import { useSnackbar } from '@/composables/general/SnackbarComposable.ts'
	import { useActivityHistoryCrud } from '@/api/activityHistory/activityHistoryApi.ts'
	import type { IBaseToDoListItem } from '@/dtos/response/interface/IBaseToDoListItem.ts'

	const props = defineProps<{
		toDoListItem: IBaseToDoListItem
		isRecursive: boolean
	}>()
	const emit = defineEmits<{ openNext: [] }>()
	const dialogShown = defineModel<boolean>({ required: true })

	const { create } = useActivityHistoryCrud()
	const { t } = useI18n()
	const { showErrorSnackbar, showSuccessSnackbar } = useSnackbar()

	const logTimeForm = ref<InstanceType<typeof LogTimeForm>>()
	const dateTime = ref(new Date())
	const length = ref(new Time())

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
		const isValid = await logTimeForm.value?.validate()
		if (!isValid?.valid) return
		const request = await create(dateTime.value, length.value, props.toDoListItem?.activity.id)
		if (request) {
			showSuccessSnackbar(t('toDoList.savedToHistory', { name: props.toDoListItem?.activity.name }))
			dialogShown.value = false
		} else {
			showErrorSnackbar(t('toDoList.errorSavingToHistory', { name: props.toDoListItem?.activity.name }))
		}
	}
</script>

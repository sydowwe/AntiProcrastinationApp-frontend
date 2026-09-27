<template>
	<VIdSelect
		v-model="selectedListId"
		:items="listOptions"
		:label="$t('toDoList.destinationList')"
		:errorMessages="conflictError"
		@update:modelValue="conflictError = []"
	/>
</template>

<script setup lang="ts">
	import { onMounted, ref } from 'vue'
	import axios from 'axios'
	import { useI18n } from 'vue-i18n'
	import { useTodoListCrud } from '@/core/todoList/api/todoListApi.ts'
	import { useDialogApi } from '@/_common/composable/general/useDialog.ts'
	import { handleHttpCodes, ServerErrorType } from '@/_common/composable/general/ErrorHandlingFunctions.ts'
	import { extractServerErrorType } from '@/_common/axiosConfig.ts'
	import type { SelectOption } from '@/_common/dto/response/general/SelectOption.ts'

	const { currentListId, activityName, submit } = defineProps<{
		currentListId: number
		activityName: string
		/**
		 * Performs the move. It runs *inside* the dialog's confirm so a refused move leaves the dialog open
		 * with the destination still selected: a list can hold one item per activity (the `(UserId,
		 * ActivityId, TodoListId)` unique index), and that 409 would otherwise be the interceptor's generic
		 * "choose another value" snackbar after the dialog had already closed. Call the API with
		 * `_silent: true` — this form words the unique-violation 409 inline and routes every other status
		 * through `handleHttpCodes` itself.
		 */
		submit: (destinationListId: number) => Promise<void>
	}>()

	const dialogApi = useDialogApi<{ destinationListId: number }>()

	const { t } = useI18n()
	const { fetchSelectOptions } = useTodoListCrud()

	const selectedListId = ref<number | null>(null)
	const listOptions = ref<SelectOption[]>([])
	const conflictError = ref<string[]>([])

	dialogApi.onConfirm(onConfirm)

	onMounted(async () => {
		dialogApi.setLoading(true)
		const allOptions = await fetchSelectOptions()
		listOptions.value = allOptions.filter(o => o.id !== currentListId)
		dialogApi.setLoading(false)
	})

	async function onConfirm() {
		const destinationListId = selectedListId.value
		if (!destinationListId) return
		conflictError.value = []
		dialogApi.setLoading(true)
		try {
			await submit(destinationListId)
		} catch (e) {
			const status = axios.isAxiosError(e) ? e.response?.status : undefined
			const errorType = axios.isAxiosError(e) ? extractServerErrorType(e) : undefined
			if (status === 409 && errorType === ServerErrorType.DbUniqueViolationError) {
				const list = listOptions.value.find(o => o.id === destinationListId)?.text ?? ''
				conflictError.value = [t('toDoList.alreadyOnDestination', { list, activity: activityName })]
			} else {
				handleHttpCodes(status ?? 0, errorType)
			}
			return
		} finally {
			dialogApi.setLoading(false)
		}
		dialogApi.close({ destinationListId })
	}
</script>

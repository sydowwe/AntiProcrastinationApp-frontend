<template>
	<VForm
		ref="formRef"
		class="d-flex flex-column ga-4 py-2"
		@submit.prevent
	>
		<p class="text-body-2 text-medium-emphasis mb-0">
			{{ $t('leisure.shoppingHandoff.hint', { project: projectName }) }}
		</p>
		<VIdSelect
			v-model="todoListId"
			:items="listOptions"
			:label="$t('leisure.shoppingHandoff.list')"
			:loading="optionsLoading"
			:rules="[requiredRule]"
			:errorMessages="listError"
			:clearable="false"
			@update:modelValue="listError = null"
		/>
		<VIdSelect
			v-model="taskPriorityId"
			:items="priorityOptions"
			:label="$t('leisure.shoppingHandoff.priority')"
			:loading="optionsLoading"
			:rules="[requiredRule]"
			:clearable="false"
		/>
		<div>
			<div class="text-subtitle-2 mb-1">
				{{ $t('leisure.shoppingHandoff.stepsPreview', { count: steps.length }) }}
			</div>
			<ol class="text-body-2 pl-5">
				<li
					v-for="step in steps"
					:key="step"
				>
					{{ step }}
				</li>
			</ol>
		</div>
	</VForm>
</template>

<script setup lang="ts">
	import { computed, ref } from 'vue'
	import axios from 'axios'
	import { useI18n } from 'vue-i18n'
	import type { VForm } from 'vuetify/components'
	import { useTodoListCrud } from '@/core/todoList/api/todoListApi.ts'
	import { useTaskPriorityCrud } from '@/core/todoList/api/taskPriorityApi.ts'
	import { useTodoListItemCrud } from '@/core/todoList/api/todoListItemApi.ts'
	import { ToDoListItemRequest } from '@/core/todoList/dto/request/ToDoListItemRequest.ts'
	import { TodoListItemStepRequest } from '@/core/todoList/dto/request/TodoListItemStepRequest.ts'
	import type { SelectOption } from '@/_common/dto/response/general/SelectOption.ts'
	import { useDialogApi } from '@/_common/composable/general/useDialog.ts'
	import { useGeneralRules } from '@/_common/composable/general/rules/RulesComposition.ts'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
	import { handleHttpCodes, ServerErrorType } from '@/_common/composable/general/ErrorHandlingFunctions.ts'
	import { extractServerErrorType } from '@/_common/axiosConfig.ts'

	const { activityId, projectName, materialsNeeded, requiredTools } = defineProps<{
		activityId: number
		projectName: string
		materialsNeeded: string[]
		requiredTools: string[]
	}>()

	// The server's `TodoListItemStep.Name` column is 255 wide.
	const STEP_NAME_MAX = 255

	const { t } = useI18n()
	const dialog = useDialogApi<boolean>()
	const { requiredRule } = useGeneralRules()
	const { showSuccessSnackbar } = useSnackbar()
	const { fetchSelectOptions: fetchListOptions } = useTodoListCrud()
	const { fetchSelectOptions: fetchPriorityOptions } = useTaskPriorityCrud()

	const formRef = ref<VForm>()
	const todoListId = ref<number | null>(null)
	const taskPriorityId = ref<number | null>(null)
	const listError = ref<string | null>(null)
	const listOptions = ref<SelectOption[]>([])
	const priorityOptions = ref<SelectOption[]>([])
	const optionsLoading = ref(true)

	// Materials first, then tools — the order the card lists them. A name that appears in both (glue
	// as a material and a tool) becomes one step, not two.
	const steps = computed(() => {
		const seen = new Set<string>()
		const result: string[] = []
		for (const raw of [...materialsNeeded, ...requiredTools]) {
			const name = raw.trim().slice(0, STEP_NAME_MAX)
			const key = name.toLocaleLowerCase()
			if (!name || seen.has(key)) continue
			seen.add(key)
			result.push(name)
		}
		return result
	})

	loadOptions()
	dialog.onConfirm(onConfirm)

	async function loadOptions() {
		try {
			const [lists, priorities] = await Promise.all([fetchListOptions(), fetchPriorityOptions()])
			listOptions.value = lists
			priorityOptions.value = priorities
		} catch {
			// The interceptor has already said why; the selects stay empty and `requiredRule` blocks confirm.
		} finally {
			optionsLoading.value = false
		}
	}

	async function onConfirm() {
		const { valid } = await formRef.value!.validate()
		if (!valid || todoListId.value == null || taskPriorityId.value == null) return
		const listId = todoListId.value
		dialog.setLoading(true)
		try {
			const request = new ToDoListItemRequest(
				activityId,
				taskPriorityId.value,
				null,
				null,
				false,
				null,
				null,
				t('leisure.shoppingHandoff.note', { project: projectName }),
				null,
				steps.value.map((name, i) => new TodoListItemStepRequest(name, i + 1)),
			)
			// `_silent` so the one refusal this dialog can explain — the activity is already on that list,
			// the (UserId, ActivityId, TodoListId) unique index — lands under the list field instead of as
			// the interceptor's generic snackbar. Every other failure goes through the shared handler below.
			await useTodoListItemCrud(listId).createWithResponse(request, { _silent: true })
			const listName = listOptions.value.find(o => o.id === listId)?.text ?? ''
			showSuccessSnackbar(t('leisure.shoppingHandoff.added', { list: listName }))
			dialog.close(true)
		} catch (e) {
			const status = axios.isAxiosError(e) ? e.response?.status : undefined
			const errorType = axios.isAxiosError(e) ? extractServerErrorType(e) : undefined
			if (status === 409 && errorType === ServerErrorType.DbUniqueViolationError) {
				listError.value = t('leisure.shoppingHandoff.alreadyOnList', { project: projectName })
			} else {
				handleHttpCodes(status ?? 0, errorType)
			}
		} finally {
			dialog.setLoading(false)
		}
	}
</script>

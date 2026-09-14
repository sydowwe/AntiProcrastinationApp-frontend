<template>
	<VForm
		ref="form"
		class="d-flex flex-column ga-3 py-2"
		@submit.prevent="onConfirm"
	>
		<VTextField
			v-model="request.text"
			:label="$t('routineTodoList.timePeriods.name')"
			:rules="[requiredRule, nameFreeRule]"
			:errorMessages="conflictError"
		></VTextField>
		<VNumberInput
			v-model="request.lengthInDays"
			:label="$t('routineTodoList.timePeriods.length')"
			:min="1"
			:rules="[lengthFreeRule]"
			@update:modelValue="onLengthChanged"
		></VNumberInput>
		<ColorPicker
			v-model="request.color"
			:label="$t('routineTodoList.timePeriods.color')"
			required
		></ColorPicker>
		<VNumberInput
			v-model="request.historyDepth"
			:label="$t('routineTodoList.timePeriods.historyDepth')"
			:min="1"
			:max="52"
			:hint="$t('routineTodoList.timePeriods.historyDepthHint')"
			persistentHint
		></VNumberInput>
		<VDivider></VDivider>
		<span class="text-caption text-medium-emphasis">
			{{ $t('routineTodoList.timePeriods.streakSettings') }}
		</span>
		<VNumberInput
			v-model="request.streakThreshold"
			:label="$t('routineTodoList.timePeriods.streakThreshold')"
			:min="1"
			:max="100"
			:hint="$t('routineTodoList.timePeriods.streakThresholdHint')"
			persistentHint
		></VNumberInput>
		<VNumberInput
			v-model="request.streakGraceDays"
			:label="$t('routineTodoList.timePeriods.graceDays')"
			:min="0"
			:hint="$t('routineTodoList.timePeriods.graceDaysHint')"
			persistentHint
		></VNumberInput>
		<VSelect
			v-if="isWeekAligned"
			v-model="request.resetAnchorDay"
			:label="$t('routineTodoList.timePeriods.resetAnchorDay')"
			:items="anchorDayOptions"
			itemTitle="label"
			itemValue="value"
			:hint="$t('routineTodoList.timePeriods.resetAnchorDayHint')"
			persistentHint
		></VSelect>
		<VNumberInput
			v-else
			v-model="request.resetAnchorDay"
			:label="$t('routineTodoList.timePeriods.resetAnchorDayOfMonth')"
			:min="0"
			:max="30"
			:hint="$t('routineTodoList.timePeriods.resetAnchorDayOfMonthHint')"
			persistentHint
		></VNumberInput>
	</VForm>
</template>

<script setup lang="ts">
	import { computed, ref } from 'vue'
	import axios from 'axios'
	import { useI18n } from 'vue-i18n'
	import { VForm } from 'vuetify/components'
	import ColorPicker from '@/_common/component/inputs/ColorPicker.vue'
	import { useAnchorDayOptions } from '@/core/todoList/composable/useAnchorDayOptions.ts'
	import { useGeneralRules } from '@/_common/composable/general/rules/RulesComposition.ts'
	import { useDialogApi } from '@/_common/composable/general/useDialog.ts'
	import { handleHttpCodes } from '@/_common/composable/general/ErrorHandlingFunctions.ts'
	import { RoutineTimePeriodEntity } from '@/core/todoList/dto/response/routine/RoutineTimePeriodEntity.ts'
	import { TimePeriodRequest } from '@/core/todoList/dto/request/TimePeriodRequest.ts'

	const {
		entityToEdit = null,
		existingPeriods = [],
		submit,
	} = defineProps<{
		entityToEdit?: RoutineTimePeriodEntity | null
		/**
		 * The account's other periods, for validating before the request goes out. Both `text` and
		 * `lengthInDays` are unique per account (`RoutineTimePeriodConfiguration.cs:13,79`), and the server
		 * reports either collision as the same bare 409, so this is the only way to tell the user *which*
		 * field is the problem. The entity being edited is excluded here.
		 */
		existingPeriods?: RoutineTimePeriodEntity[]
		/**
		 * Performs the create/update. It runs *inside* the dialog's confirm so a failed request leaves the
		 * form on screen with what the user typed: a 409 from the unique indexes would otherwise be worded
		 * by the interceptor as "changed by someone else" after the dialog had already closed. Call the API
		 * with `_silent: true` — this form handles the 409 inline and routes every other status through
		 * `handleHttpCodes` itself.
		 */
		submit: (request: TimePeriodRequest) => Promise<void>
	}>()

	const dialogApi = useDialogApi<{
		idToEdit: number | null
		request: TimePeriodRequest
	}>()

	const { t } = useI18n()
	const { requiredRule } = useGeneralRules()
	const { anchorDayOptions } = useAnchorDayOptions()

	const form = ref<InstanceType<typeof VForm>>()
	const request = ref(entityToEdit ? TimePeriodRequest.fromEntity(entityToEdit) : new TimePeriodRequest())
	// Only reached on a race the pre-check could not see (another client added a period since the list
	// loaded); the 409 body says nothing about which index refused, so the message names both fields.
	const conflictError = ref<string[]>([])

	const others = computed(() => existingPeriods.filter(p => p.id !== entityToEdit?.id))

	function nameFreeRule(value: string | null): true | string {
		const name = value?.trim().toLowerCase() ?? ''
		return (
			!others.value.some(p => p.text?.trim().toLowerCase() === name) || t('routineTodoList.timePeriods.nameTaken')
		)
	}

	function lengthFreeRule(value: number | string | null): true | string {
		const days = Number(value)
		return (
			!others.value.some(p => p.lengthInDays === days) ||
			t('routineTodoList.timePeriods.lengthTaken', { days }, days)
		)
	}

	const isWeekAligned = computed(() => {
		const d = request.value.lengthInDays
		return d <= 7 || d % 7 === 0
	})

	dialogApi.onConfirm(onConfirm)

	function onLengthChanged() {
		request.value.resetAnchorDay = 0
		request.value.historyDepth = RoutineTimePeriodEntity.defaultHistoryDepth(request.value.lengthInDays)
	}

	async function onConfirm() {
		// A stale server error would fail `validate()` below; the server re-decides on every submit.
		conflictError.value = []
		const { valid } = (await form.value?.validate()) ?? { valid: false }
		if (!valid) return
		dialogApi.setLoading(true)
		try {
			await submit(request.value)
		} catch (e) {
			const status = axios.isAxiosError(e) ? e.response?.status : undefined
			if (status === 409) {
				conflictError.value = [t('routineTodoList.timePeriods.conflict')]
			} else {
				handleHttpCodes(status ?? 0)
			}
			return
		} finally {
			dialogApi.setLoading(false)
		}
		dialogApi.close({
			idToEdit: entityToEdit?.id ?? null,
			request: request.value,
		})
	}
</script>

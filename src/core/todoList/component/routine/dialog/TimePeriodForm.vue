<template>
	<VForm
		ref="form"
		class="d-flex flex-column ga-3 py-2"
		@submit.prevent="onConfirm"
	>
		<VTextField
			v-model="request.text"
			label="Name"
			:rules="[requiredRule]"
		></VTextField>
		<VNumberInput
			v-model="request.lengthInDays"
			label="Length in days"
			:min="1"
			@update:modelValue="onLengthChanged"
		></VNumberInput>
		<ColorPicker
			v-model="request.color"
			label="Color"
		></ColorPicker>
		<VNumberInput
			v-model="request.historyDepth"
			label="History depth (periods)"
			:min="1"
			:max="52"
			hint="How many past periods to show in the completion heatmap"
			persistentHint
		></VNumberInput>
		<VDivider></VDivider>
		<span class="text-caption text-medium-emphasis">Streak settings</span>
		<VNumberInput
			v-model="request.streakThreshold"
			label="Streak threshold (%)"
			:min="1"
			:max="100"
			hint="Minimum % of items completed to count the period toward your streak"
			persistentHint
		></VNumberInput>
		<VNumberInput
			v-model="request.streakGraceDays"
			label="Grace days"
			:min="0"
			hint="Days after the period ends before the streak resets"
			persistentHint
		></VNumberInput>
		<VSelect
			v-if="isWeekAligned"
			v-model="request.resetAnchorDay"
			label="Reset anchor day"
			:items="weekDayOptions"
			itemTitle="label"
			itemValue="value"
			hint="Week day to anchor resets to"
			persistentHint
		></VSelect>
		<VNumberInput
			v-else
			v-model="request.resetAnchorDay"
			label="Reset anchor day of month"
			:min="0"
			:max="30"
			hint="Day of month to align the start to (0 = rolling, no anchor)"
			persistentHint
		></VNumberInput>
	</VForm>
</template>

<script setup lang="ts">
	import { computed, ref } from 'vue'
	import { VForm } from 'vuetify/components'
	import ColorPicker from '@/_common/component/inputs/ColorPicker.vue'
	import { useGeneralRules } from '@/_common/composable/general/rules/RulesComposition.ts'
	import { useDialogApi } from '@/_common/composable/general/useDialog.ts'
	import { RoutineTimePeriodEntity } from '@/core/todoList/dto/response/routine/RoutineTimePeriodEntity.ts'
	import { TimePeriodRequest } from '@/core/todoList/dto/request/TimePeriodRequest.ts'

	const { entityToEdit = null } = defineProps<{
		entityToEdit?: RoutineTimePeriodEntity | null
	}>()

	const dialogApi = useDialogApi<{
		idToEdit: number | null
		request: TimePeriodRequest
	}>()

	const { requiredRule } = useGeneralRules()

	const weekDayOptions = [
		{ label: 'Rolling (no anchor)', value: 0 },
		{ label: 'Monday', value: 1 },
		{ label: 'Tuesday', value: 2 },
		{ label: 'Wednesday', value: 3 },
		{ label: 'Thursday', value: 4 },
		{ label: 'Friday', value: 5 },
		{ label: 'Saturday', value: 6 },
		{ label: 'Sunday', value: 7 },
	]

	const form = ref<InstanceType<typeof VForm>>()
	const request = ref(entityToEdit ? TimePeriodRequest.fromEntity(entityToEdit) : new TimePeriodRequest())

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
		const { valid } = (await form.value?.validate()) ?? { valid: false }
		if (!valid) return
		dialogApi.close({
			idToEdit: entityToEdit?.id ?? null,
			request: request.value,
		})
	}
</script>

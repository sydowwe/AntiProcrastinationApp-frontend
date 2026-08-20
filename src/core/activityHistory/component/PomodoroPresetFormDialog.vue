<template>
	<MyDialog
		v-model="dialog"
		:title="isEdit ? $t('history.pomodoroPreset.editTitle') : $t('history.pomodoroPreset.addTitle')"
		:confirmBtnLabel="isEdit ? $t('general.update') : $t('general.create')"
		@confirmed="onConfirmed"
	>
		<VForm
			ref="form"
			class="d-flex flex-column ga-6"
			@submit.prevent="onConfirmed"
		>
			<VBtnToggle
				v-model="activeTab"
				color="primaryOutline"
				variant="tonal"
				density="comfortable"
				divided
				mandatory
			>
				<VBtn
					value="basic"
					class="flex-1-1 text-none"
				>
					<VIcon
						icon="fa-solid fa-clock"
						size="small"
						class="mr-2"
					></VIcon>
					{{ $t('history.pomodoroPreset.tabBasic') }}
				</VBtn>
				<VBtn
					value="focus"
					class="flex-1-1 text-none"
				>
					<VIcon
						icon="fa-solid fa-brain"
						size="small"
						class="mr-2"
					></VIcon>
					{{ $t('history.pomodoroPreset.tabWithFocus') }}
				</VBtn>
				<VBtn
					value="both"
					class="flex-1-1 text-none"
				>
					<VIcon
						icon="fa-solid fa-list-check"
						size="small"
						class="mr-2"
					></VIcon>
					{{ $t('history.pomodoroPreset.tabWithBoth') }}
				</VBtn>
			</VBtnToggle>

			<VTextField
				v-model="request.name"
				:label="$t('history.pomodoroPreset.name')"
				:rules="[requiredRule]"
				hideDetails
			></VTextField>

			<VDivider></VDivider>

			<div style="margin-top: -8px">
				<div class="text-subtitle-2 text-medium-emphasis mb-3">
					<VIcon
						icon="fa-solid fa-stopwatch"
						size="small"
						class="mr-2"
					></VIcon>
					{{ $t('history.pomodoroPreset.timerDurations') }}
				</div>
				<div class="d-flex flex-column flex-sm-row ga-3">
					<TimePicker
						v-model="focusDuration"
						:label="$t('history.pomodoroPreset.focusLabel')"
						viewMode="minute"
						variant="outlined"
						color="primary"
						density="comfortable"
						class="flex-sm-1-1"
					></TimePicker>
					<TimePicker
						v-model="shortBreakDuration"
						:label="$t('history.pomodoroPreset.shortBreakLabel')"
						viewMode="minute"
						variant="outlined"
						color="success"
						density="comfortable"
						class="flex-sm-1-1"
					></TimePicker>
					<TimePicker
						v-model="longBreakDuration"
						:label="$t('history.pomodoroPreset.longBreakLabel')"
						viewMode="minute"
						variant="outlined"
						color="info"
						density="comfortable"
						class="flex-sm-1-1"
					></TimePicker>
				</div>
			</div>

			<VDivider></VDivider>

			<div style="margin-top: -8px">
				<div class="text-subtitle-2 text-medium-emphasis mb-4">
					<VIcon
						icon="fa-solid fa-rotate"
						size="small"
						class="mr-2"
					></VIcon>
					{{ $t('history.pomodoroPreset.cycleSettings') }}
				</div>
				<div class="d-flex flex-column flex-sm-row ga-4">
					<VSelect
						v-model="request.focusPeriodInCycleCount"
						:label="$t('history.pomodoroPreset.focusPeriodsPerCycle')"
						class="flex-sm-1-1"
						:items="[2, 3, 4, 5, 6]"
						:rules="[requiredRule]"
						hideDetails
						density="comfortable"
					></VSelect>
					<VSelect
						v-model="request.numberOfCycles"
						:label="$t('pomodoroTimer.numberOfCycles')"
						class="flex-sm-1-1"
						:items="[1, 2, 3, 4, 5, 6]"
						:rules="[requiredRule]"
						hideDetails
						density="comfortable"
					></VSelect>
				</div>
			</div>

			<VDivider v-if="activeTab !== 'basic'"></VDivider>

			<VIdAutocomplete
				v-if="activeTab === 'focus' || activeTab === 'both'"
				v-model="request.focusActivityId"
				:label="$t('pomodoroTimer.focusActivity')"
				:items="activityOptions"
				:rules="[requiredRule]"
				hideDetails
			></VIdAutocomplete>

			<VIdAutocomplete
				v-if="activeTab === 'both'"
				v-model="request.restActivityId"
				:label="$t('pomodoroTimer.restActivity')"
				:items="activityOptions"
				:rules="[requiredRule]"
				hideDetails
			></VIdAutocomplete>
		</VForm>

		<template
			v-if="isEdit"
			#centerButton
		>
			<VBtn
				color="error"
				variant="outlined"
				@click="onDelete"
			>
				{{ $t('general.delete') }}
			</VBtn>
		</template>
	</MyDialog>
</template>

<script setup lang="ts">
	import MyDialog from '@/_common/component/dialog/MyDialog.vue'
	import { computed, onMounted, ref } from 'vue'
	import { useI18n } from 'vue-i18n'
	import type { PomodoroTimerPreset } from '@/core/activityHistory/dto/response/PomodoroTimerPreset.ts'
	import { PomodoroTimerPresetRequest } from '@/core/activityHistory/dto/request/PomodoroTimerPresetRequest.ts'
	import { useGeneralRules } from '@/_common/composable/general/rules/RulesComposition.ts'
	import { useActivityCrud } from '@/core/activity/api/activityApi.ts'
	import { usePomodoroTimerPresetCrud } from '@/core/activityHistory/api/pomodoroTimerPresetApi.ts'
	import { VForm } from 'vuetify/components'
	import TimePicker from '@/_common/component/dateTime/TimePicker.vue'
	import { Time } from '@/_common/dto/dto/Time.ts'
	import type { SelectOption } from '@/_common/dto/response/general/SelectOption.ts'
	import { useDialog } from '@/_common/composable/general/useDialog.ts'

	const emit = defineEmits<{
		(e: 'created'): void
		(e: 'updated'): void
		(e: 'deleted'): void
	}>()
	const { create, update, deleteEntity } = usePomodoroTimerPresetCrud()
	const { fetchSelectOptions } = useActivityCrud()
	const { requiredRule } = useGeneralRules()
	const { t } = useI18n()
	const { confirm } = useDialog()

	const form = ref<InstanceType<typeof VForm>>()
	const dialog = ref(false)
	const request = ref(new PomodoroTimerPresetRequest())
	const idToEdit = ref<number | null>(null)
	const isEdit = ref(false)
	const activityOptions = ref<SelectOption[]>([])
	const activeTab = ref<'basic' | 'focus' | 'both'>('basic')

	const focusDuration = computed({
		get: () => Time.fromMinutes(request.value.focusDuration),
		set: (value: Time) => {
			request.value.focusDuration = value.getInMinutes
		},
	})

	const shortBreakDuration = computed({
		get: () => Time.fromMinutes(request.value.shortBreakDuration),
		set: (value: Time) => {
			request.value.shortBreakDuration = value.getInMinutes
		},
	})

	const longBreakDuration = computed({
		get: () => Time.fromMinutes(request.value.longBreakDuration),
		set: (value: Time) => {
			request.value.longBreakDuration = value.getInMinutes
		},
	})

	onMounted(async function loadActivityOptions() {
		activityOptions.value = await fetchSelectOptions()
	})

	function openAddDialog() {
		request.value = new PomodoroTimerPresetRequest()
		request.value.name = t('history.pomodoroPreset.defaultName')
		activeTab.value = 'basic'
		isEdit.value = false
		dialog.value = true
	}

	function openEditDialog(preset: PomodoroTimerPreset) {
		idToEdit.value = preset.id
		request.value = PomodoroTimerPresetRequest.fromEntity(preset)

		// Determine which tab to show based on preset type
		if (preset.hasFocusActivity && preset.hasRestActivity) {
			activeTab.value = 'both'
		} else if (preset.hasFocusActivity) {
			activeTab.value = 'focus'
		} else {
			activeTab.value = 'basic'
		}

		isEdit.value = true
		dialog.value = true
	}

	async function onConfirmed() {
		const { valid } = await form.value!.validate()
		if (!valid) return

		// Clear activity IDs based on selected tab
		if (activeTab.value === 'basic') {
			request.value.focusActivityId = null
			request.value.restActivityId = null
		} else if (activeTab.value === 'focus') {
			request.value.restActivityId = null
		}

		if (isEdit.value) {
			await update(idToEdit.value!, request.value)
			emit('updated')
		} else {
			await create(request.value)
			emit('created')
		}

		dialog.value = false
		form.value!.reset()
		request.value = new PomodoroTimerPresetRequest()
		idToEdit.value = null
		isEdit.value = false
		activeTab.value = 'basic'
	}

	async function onDelete() {
		if (!idToEdit.value) return

		const confirmed = await confirm({ text: t('history.confirmDeletePreset'), confirmBtnColor: 'error' })
		if (!confirmed) return

		await deleteEntity(idToEdit.value)
		emit('deleted')

		dialog.value = false
		form.value!.reset()
		request.value = new PomodoroTimerPresetRequest()
		idToEdit.value = null
		isEdit.value = false
		activeTab.value = 'basic'
	}

	defineExpose({ openAddDialog, openEditDialog })
</script>

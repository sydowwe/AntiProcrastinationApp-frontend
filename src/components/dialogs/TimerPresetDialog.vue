<template>
	<MyDialog
		v-model="dialog"
		:title="isEdit ? 'Edit timer preset' : 'Add timer preset'"
		:confirmBtnLabel="isEdit ? $t('general.update') : $t('general.create')"
		closeBtnColor="default"
		closeBtnVariant="tonal"
		@confirmed="onConfirmed"
	>
		<VForm
			ref="form"
			class="d-flex flex-column ga-6"
			@submit.prevent="onConfirmed"
		>
			<TimePicker
				v-model="duration"
				class="mx-auto"
				label="Duration"
				viewMode="minute"
				variant="outlined"
				style="max-width: 200px"
			></TimePicker>
			<VIdAutocomplete
				v-if="isActivityMode"
				v-model="request.activityId"
				label="Activity"
				:items="activityOptions"
				:rules="[requiredRule]"
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
	import MyDialog from '@/components/dialogs/MyDialog.vue'
	import { computed, onMounted, ref } from 'vue'
	import type { TimerPreset } from '@/dtos/response/activityRecording/TimerPreset.ts'
	import { TimerPresetRequest } from '@/dtos/request/activityRecording/TimerPresetRequest.ts'
	import { useGeneralRules } from '@/composables/general/rules/RulesComposition.ts'
	import { useActivityCrud } from '@/api/activity/activityApi.ts'
	import { useTimerPresetCrud } from '@/api/activityHistory/timerPresetApi.ts'
	import { VForm } from 'vuetify/components'
	import TimePicker from '@/components/general/dateTime/TimePicker.vue'
	import { Time } from '@/dtos/dto/Time.ts'
	import type { SelectOption } from '@/dtos/response/general/SelectOption.ts'

	const emit = defineEmits<{
		(e: 'created'): void
		(e: 'updated'): void
		(e: 'deleted'): void
	}>()
	const { create, update, deleteEntity } = useTimerPresetCrud()
	const { fetchSelectOptions } = useActivityCrud()
	const { requiredRule } = useGeneralRules()

	const form = ref<InstanceType<typeof VForm>>()
	const dialog = ref(false)
	const request = ref(new TimerPresetRequest())
	const isActivityMode = ref(false)
	const idToEdit = ref<number | null>(null)
	const isEdit = ref(false)
	const activityOptions = ref<SelectOption[]>([])

	const duration = computed({
		get: () => Time.fromMinutes(request.value.duration),
		set: (value: Time) => {
			request.value.duration = value.getInMinutes
		},
	})

	onMounted(async function loadActivityOptions() {
		activityOptions.value = await fetchSelectOptions()
	})

	function openAddDialog(_isActivityMode: boolean) {
		request.value = new TimerPresetRequest()
		isEdit.value = false
		dialog.value = true
		isActivityMode.value = _isActivityMode
	}

	function openEditDialog(preset: TimerPreset, _isActivityMode: boolean) {
		idToEdit.value = preset.id
		request.value = TimerPresetRequest.fromEntity(preset)
		isEdit.value = true
		dialog.value = true
		isActivityMode.value = _isActivityMode
	}

	async function onConfirmed() {
		const { valid } = await form.value!.validate()
		if (!valid) return

		if (isEdit.value) {
			await update(idToEdit.value!, request.value)
			emit('updated')
		} else {
			await create(request.value)
			emit('created')
		}

		dialog.value = false
		form.value!.reset()
		request.value = new TimerPresetRequest()
		idToEdit.value = null
		isEdit.value = false
	}

	async function onDelete() {
		if (!idToEdit.value) return

		const confirmed = confirm('Are you sure you want to delete this preset?')
		if (!confirmed) return

		await deleteEntity(idToEdit.value)
		emit('deleted')

		dialog.value = false
		form.value!.reset()
		request.value = new TimerPresetRequest()
		idToEdit.value = null
		isEdit.value = false
	}

	defineExpose({ openAddDialog, openEditDialog })
</script>

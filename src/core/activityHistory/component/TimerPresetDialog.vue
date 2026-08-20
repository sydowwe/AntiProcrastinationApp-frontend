<template>
	<MyDialog
		v-model="dialog"
		:title="isEdit ? $t('history.timerPreset.editTitle') : $t('history.timerPreset.addTitle')"
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
				:label="$t('dateTime.duration')"
				viewMode="minute"
				variant="outlined"
				style="max-width: 200px"
			></TimePicker>
			<VIdAutocomplete
				v-if="isActivityMode"
				v-model="request.activityId"
				:label="$t('activities.activity')"
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
	import MyDialog from '@/_common/component/dialog/MyDialog.vue'
	import { computed, onMounted, ref } from 'vue'
	import { useI18n } from 'vue-i18n'
	import type { TimerPreset } from '@/core/activityHistory/dto/response/TimerPreset.ts'
	import { TimerPresetRequest } from '@/core/activityHistory/dto/request/TimerPresetRequest.ts'
	import { useGeneralRules } from '@/_common/composable/general/rules/RulesComposition.ts'
	import { useActivityCrud } from '@/core/activity/api/activityApi.ts'
	import { useTimerPresetCrud } from '@/core/activityHistory/api/timerPresetApi.ts'
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
	const { t } = useI18n()
	const { confirm } = useDialog()

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

		const confirmed = await confirm({ text: t('history.confirmDeletePreset'), confirmBtnColor: 'error' })
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

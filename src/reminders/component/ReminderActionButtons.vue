<template>
	<div class="d-flex align-center ga-2">
		<template v-if="status === ReminderStatus.Active">
			<VBtn
				v-if="!iconOnly"
				color="warningDark"
				prependIcon="pause"
				size="small"
				:loading="busy"
				@click="onPause"
			>
				{{ $t('reminders.actions.pause') }}
			</VBtn>
			<VIconBtn
				v-else
				icon="pause"
				variant="tonal"
				size="small"
				color="warning"
				:loading="busy"
				:title="$t('reminders.actions.pause')"
				@click="onPause"
			>
				<VIcon size="15" />
			</VIconBtn>
		</template>

		<template v-else-if="status === ReminderStatus.Paused">
			<VBtn
				v-if="!iconOnly"
				color="successDark"
				prependIcon="play"
				size="small"
				:loading="busy"
				@click="onResume"
			>
				{{ $t('reminders.actions.resume') }}
			</VBtn>
			<VIconBtn
				v-else
				icon="circle-play"
				variant="tonal"
				size="small"
				color="successDark"
				:loading="busy"
				:title="$t('reminders.actions.resume')"
				@click="onResume"
			>
				<VIcon size="15" />
			</VIconBtn>
		</template>

		<template v-if="canCancel">
			<VBtn
				v-if="!iconOnly"
				color="error"
				variant="outlined"
				prependIcon="ban"
				size="small"
				:loading="busy"
				@click="cancelDialogOpen = true"
			>
				{{ $t('reminders.actions.cancel') }}
			</VBtn>
			<VIconBtn
				v-else
				icon="ban"
				variant="tonal"
				size="small"
				color="error"
				:loading="busy"
				:title="$t('reminders.actions.cancel')"
				@click="cancelDialogOpen = true"
			>
				<VIcon size="15" />
			</VIconBtn>
		</template>

		<CancelReminderDialog
			v-model="cancelDialogOpen"
			:reminderKey="reminderKey.kind"
			:loading="busy"
			@confirmed="onCancel"
		/>
	</div>
</template>

<script setup lang="ts">
	import { computed, ref } from 'vue'
	import { useI18n } from 'vue-i18n'
	import CancelReminderDialog from '@/core/reminders/component/CancelReminderDialog.vue'
	import { ReminderStatus } from '@/core/reminders/dto/enum/ReminderStatus.ts'
	import type { ReminderKeyRequest } from '@/core/reminders/dto/request/ReminderKeyRequest.ts'
	import { cancelReminder, pauseReminder, resumeReminder } from '@/core/reminders/api/ReminderDefinitionApi.ts'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'

	const {
		reminderKey,
		status,
		iconOnly = false,
	} = defineProps<{
		reminderKey: ReminderKeyRequest
		status: ReminderStatus
		iconOnly?: boolean
	}>()

	const emit = defineEmits<{
		// The reminder's status changed (pause/resume/cancel); reload it to reflect status and next occurrence.
		statusChanged: []
	}>()

	const i18n = useI18n()
	const { showSuccessSnackbar, showErrorSnackbar } = useSnackbar()

	const busy = ref(false)
	const cancelDialogOpen = ref(false)

	// Cancelled / Completed are terminal — no further actions are offered.
	const canCancel = computed(() => status === ReminderStatus.Active || status === ReminderStatus.Paused)

	async function onPause() {
		if (busy.value) return
		busy.value = true
		try {
			await pauseReminder(reminderKey)
			showSuccessSnackbar(i18n.t('reminders.actions.paused'))
			emit('statusChanged')
		} catch {
			showErrorSnackbar(i18n.t('reminders.actions.pauseError'))
		} finally {
			busy.value = false
		}
	}

	async function onResume() {
		if (busy.value) return
		busy.value = true
		try {
			await resumeReminder(reminderKey)
			showSuccessSnackbar(i18n.t('reminders.actions.resumed'))
			emit('statusChanged')
		} catch {
			showErrorSnackbar(i18n.t('reminders.actions.resumeError'))
		} finally {
			busy.value = false
		}
	}

	async function onCancel() {
		if (busy.value) return
		busy.value = true
		try {
			await cancelReminder(reminderKey)
			showSuccessSnackbar(i18n.t('reminders.actions.cancelled'))
			cancelDialogOpen.value = false
			emit('statusChanged')
		} catch {
			showErrorSnackbar(i18n.t('reminders.actions.cancelError'))
		} finally {
			busy.value = false
		}
	}
</script>

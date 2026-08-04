<template>
	<div class="d-flex align-center ga-2">
		<VBtn
			v-if="!iconOnly"
			color="primary"
			prependIcon="play"
			size="small"
			:loading="triggering"
			:disabled="!canTrigger"
			:title="triggerTitle"
			@click="onTrigger"
		>
			{{ $t('scheduler.actions.triggerNow') }}
		</VBtn>
		<VIconBtn
			v-else
			icon="play"
			variant="tonal"
			size="small"
			color="primaryOutline"
			:loading="triggering"
			:disabled="!canTrigger"
			:title="triggerTitle"
			@click="onTrigger"
		>
			<VIcon size="15" />
		</VIconBtn>

		<template v-if="status === JobStatus.Active">
			<VBtn
				v-if="!iconOnly"
				color="warningDark"
				prependIcon="pause"
				size="small"
				:loading="busy"
				@click="onPause"
			>
				{{ $t('scheduler.actions.pause') }}
			</VBtn>
			<VIconBtn
				v-else
				icon="pause"
				variant="tonal"
				size="small"
				color="warning"
				:loading="busy"
				:title="$t('scheduler.actions.pause')"
				@click="onPause"
			>
				<VIcon size="15" />
			</VIconBtn>
		</template>

		<template v-else-if="status === JobStatus.Paused">
			<VBtn
				v-if="!iconOnly"
				color="successDark"
				prependIcon="play"
				size="small"
				:loading="busy"
				@click="onResume"
			>
				{{ $t('scheduler.actions.resume') }}
			</VBtn>
			<VIconBtn
				v-else
				icon="circle-play"
				variant="tonal"
				size="small"
				color="successDark"
				:loading="busy"
				:title="$t('scheduler.actions.resume')"
				@click="onResume"
			>
				<VIcon size="15" />
			</VIconBtn>
		</template>
	</div>
</template>

<script setup lang="ts">
	import { computed, ref } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { isAxiosError } from 'axios'
	import { JobStatus } from '@/core/scheduler/dto/enum/JobStatus.ts'
	import { pauseJob, resumeJob, triggerJobNow } from '@/core/scheduler/api/SchedulerApi.ts'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'

	const {
		jobId,
		status,
		isOrphaned,
		iconOnly = false,
	} = defineProps<{
		jobId: number
		status: JobStatus
		isOrphaned: boolean
		iconOnly?: boolean
	}>()

	const emit = defineEmits<{
		// A new manual run was requested; it will appear in the run history shortly (runs in the background).
		triggered: []
		// The job's status changed (pause/resume); reload the job/list to reflect status and next-run.
		statusChanged: []
	}>()

	const i18n = useI18n()
	const { showSuccessSnackbar, showErrorSnackbar } = useSnackbar()

	const triggering = ref(false)
	const busy = ref(false)

	// A removed or orphaned job can no longer run, so triggering it makes no sense.
	const canTrigger = computed(() => !isOrphaned && status !== JobStatus.Removed)
	const triggerTitle = computed(() =>
		isOrphaned ? i18n.t('scheduler.actions.cannotTriggerOrphaned') : i18n.t('scheduler.actions.triggerNow'),
	)

	async function onTrigger() {
		if (!canTrigger.value || triggering.value) return
		triggering.value = true
		try {
			await triggerJobNow(jobId)
			showSuccessSnackbar(i18n.t('scheduler.actions.triggered'))
			emit('triggered')
		} catch (e: unknown) {
			showErrorSnackbar(actionError(e, 'scheduler.actions.triggerError'))
		} finally {
			triggering.value = false
		}
	}

	async function onPause() {
		if (busy.value) return
		busy.value = true
		try {
			await pauseJob(jobId)
			showSuccessSnackbar(i18n.t('scheduler.actions.paused'))
			emit('statusChanged')
		} catch (e: unknown) {
			showErrorSnackbar(actionError(e, 'scheduler.actions.pauseError'))
		} finally {
			busy.value = false
		}
	}

	async function onResume() {
		if (busy.value) return
		busy.value = true
		try {
			await resumeJob(jobId)
			showSuccessSnackbar(i18n.t('scheduler.actions.resumed'))
			emit('statusChanged')
		} catch (e: unknown) {
			showErrorSnackbar(actionError(e, 'scheduler.actions.resumeError'))
		} finally {
			busy.value = false
		}
	}

	function actionError(e: unknown, fallbackKey: string): string {
		if (isAxiosError(e) && e.response?.status === 404) {
			return i18n.t('scheduler.errors.jobNotFound')
		}
		return i18n.t(fallbackKey)
	}
</script>

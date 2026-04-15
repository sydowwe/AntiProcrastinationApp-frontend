<template>
	<VRow
		justify="center"
		:class="compact ? undefined : 'py-4 my-auto'"
	>
		<VCol
			cols="12"
			:sm="compact ? undefined : 11"
			:md="compact ? undefined : 10"
			:lg="compact ? undefined : 7"
			:xl="compact ? undefined : 6"
			class="d-flex flex-column"
		>
			<TimePicker
				v-if="timeInputVisible"
				v-model="initialTime"
				class="mx-auto"
				viewMode="minute"
				:label="$t('dateTime.length')"
				color="primaryOutline"
				density="default"
				icon="hourglass-half"
				hideDetails
			></TimePicker>
			<TimeDisplayWithProgress
				v-else
				:title="selectedActivityName"
				:timeInitialObject="initialTime"
				:timeRemainingObject="timeRemainingObject"
			></TimeDisplayWithProgress>

			<TimerControls
				class="my-7"
				:intervalId="intervalId"
				:paused="paused"
				@start="start"
				@pause="pause"
				@stop="stop"
			></TimerControls>
			<template v-if="timeInputVisible">
				<hr class="mb-4" />
				<TimerPresetsSection
					:timeInputVisible
					@applyPreset="applyPreset"
				></TimerPresetsSection>
				<hr
					class="mt-6 mb-4"
					v-if="!activityId"
				/>
				<ActivitySelectionForm
					v-if="!activityId"
					ref="activitySelectionForm"
					v-model:activityId="selectedActivityId"
					:formDisabled="formDisabled"
				></ActivitySelectionForm>
			</template>
		</VCol>
	</VRow>
	<SaveActivityDialog
		ref="saveDialog"
		@saved="saveActivity"
		@resetTime="resetTimer"
	></SaveActivityDialog>
</template>
<script setup lang="ts">
	import ActivitySelectionForm from '../../components/ActivitySelectionForm.vue'
	import SaveActivityDialog from '../../components/dialogs/SaveActivityDialog.vue'
	import TimerPresetsSection from '../../components/addActivityToHistory/TimerPresetsSection.vue'
	import { checkNotificationPermission, showNotification } from '@/utils/notifications.ts'
	import { Time } from '@/dtos/dto/Time.ts'
	import { computed, onUnmounted, ref } from 'vue'
	import TimePicker from '@/components/general/dateTime/TimePicker.vue'
	import TimeDisplayWithProgress from '@/components/general/dateTime/TimeDisplayWithProgress.vue'
	import TimerControls from '@/components/addActivityToHistory/TimerControls.vue'
	import { TimePrecise } from '@/dtos/dto/TimePrecise.ts'
	import { useSnackbar } from '@/composables/general/SnackbarComposable.ts'
	import { useTimerNotifications } from '@/composables/activity/useTimerNotifications.ts'
	import type { TimerPreset } from '@/dtos/response/activityRecording/TimerPreset.ts'

	const { activityId = null, compact = false } = defineProps<{
		activityId?: number | null
		compact?: boolean
	}>()

	const emit = defineEmits<{
		started: [actualStartTime: Time]
		done: [startTimestamp: Date, length: Time]
	}>()

	const { showErrorSnackbar } = useSnackbar()
	const { triggerTimerEndNotification, stopAllNotifications } = useTimerNotifications()

	const activitySelectionForm = ref<InstanceType<typeof ActivitySelectionForm>>()
	const saveDialog = ref<InstanceType<typeof SaveActivityDialog>>()

	const timeInputVisible = ref(true)
	const initialTime = ref(new Time())
	const paused = ref(false)
	const intervalId = ref<number | undefined>(undefined)
	const startTimestamp = ref(new Date())
	const formDisabled = ref(false)
	const selectedActivityId = ref<number | null>(activityId)
	const selectedActivityName = ref<string>('')

	const endsAt = ref<number | null>(null)
	const pausedRemaining = ref<number | null>(null)
	const notificationTimeoutId = ref<number | undefined>(undefined)
	const now = ref(Date.now())

	const timeRemaining = computed(() => {
		if (endsAt.value !== null) {
			return Math.max(0, Math.ceil((endsAt.value - now.value) / 1000))
		}
		if (pausedRemaining.value !== null) {
			return Math.max(0, Math.ceil(pausedRemaining.value / 1000))
		}
		return 0
	})

	const timeRemainingObject = computed(() => {
		return TimePrecise.fromSeconds(timeRemaining.value)
	})

	checkNotificationPermission()

	async function start() {
		if (paused.value) {
			resume()
		} else {
			if (initialTime.value.getInSeconds === 0) {
				showErrorSnackbar('Please set a timer duration')
				return
			}
			const validationResult = await activitySelectionForm.value?.validate()
			if (!validationResult || validationResult.length === 0) {
				formDisabled.value = true
				startTimestamp.value = new Date()
				selectedActivityName.value = activitySelectionForm.value!.getSelectedActivityName as string
				timeInputVisible.value = false
				const durationMs = initialTime.value.getInSeconds * 1000
				const currentTime = Date.now()
				now.value = currentTime
				endsAt.value = currentTime + durationMs
				startUpdateInterval()
				scheduleNotificationTimeout()
				emit('started', Time.fromDate(startTimestamp.value))
			}
		}
	}

	function pause() {
		clearInterval(intervalId.value)
		clearTimeout(notificationTimeoutId.value)
		intervalId.value = undefined
		notificationTimeoutId.value = undefined
		if (endsAt.value !== null) {
			pausedRemaining.value = endsAt.value - Date.now()
			endsAt.value = null
		}
		paused.value = true
	}

	function resume() {
		paused.value = false
		if (pausedRemaining.value !== null) {
			endsAt.value = Date.now() + pausedRemaining.value
			pausedRemaining.value = null
		}
		startUpdateInterval()
		scheduleNotificationTimeout()
	}

	function startUpdateInterval() {
		intervalId.value = setInterval(() => {
			now.value = Date.now()
			if (timeRemaining.value === 0) {
				stop(true)
			}
		}, 250)
	}

	function scheduleNotificationTimeout() {
		if (endsAt.value === null) return
		const delay = endsAt.value - Date.now()
		if (delay > 0) {
			notificationTimeoutId.value = setTimeout(() => {
				if (endsAt.value !== null && timeRemaining.value === 0) {
					stop(true)
				}
			}, delay)
		}
	}

	function stop(automatic: boolean) {
		clearInterval(intervalId.value)
		clearTimeout(notificationTimeoutId.value)
		intervalId.value = undefined
		notificationTimeoutId.value = undefined

		const name = selectedActivityName.value
		timeInputVisible.value = true
		if (automatic) {
			triggerTimerEndNotification('Timer ended!', name)
			showNotification('Timer ended', `Your timer for ${name} ended it ran for ${timePassed().getNice}`)
		}
		if (timePassed().getInMinutes > 0) {
			if (!activityId) {
				saveDialog.value!.open(name, timePassed())
			} else {
				emit('done', startTimestamp.value, timePassed())
			}
		} else {
			resetTimer()
		}
	}

	function resetTimer() {
		paused.value = false
		intervalId.value = undefined
		notificationTimeoutId.value = undefined
		formDisabled.value = false
		timeInputVisible.value = true
		endsAt.value = null
		pausedRemaining.value = null
		stopAllNotifications()
	}

	async function saveActivity() {
		if (!activityId) {
			await activitySelectionForm.value!.saveActivityToHistory(startTimestamp.value, timePassed())
		}
	}

	function timePassed() {
		return timeRemaining.value === 0
			? initialTime.value
			: initialTime.value.subtract(timeRemainingObject.value.toTimeLength)
	}

	function applyPreset(preset: TimerPreset) {
		initialTime.value = Time.fromMinutes(preset.duration)
		if (preset.activity) {
			selectedActivityId.value = preset.activity.id
		}
	}

	onUnmounted(() => {
		clearInterval(intervalId.value)
		clearTimeout(notificationTimeoutId.value)
	})
</script>

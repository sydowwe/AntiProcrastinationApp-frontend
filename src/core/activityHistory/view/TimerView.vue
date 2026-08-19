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
					:activityPresetsVisible="!activityId"
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
					v-model:selection="selection"
					:formDisabled="formDisabled"
				></ActivitySelectionForm>
			</template>
		</VCol>
	</VRow>
</template>
<script setup lang="ts">
	import ActivitySelectionForm from '@/core/activity/component/ActivitySelectionForm.vue'
	import SaveActivityBody from '@/core/activity/component/SaveActivityBody.vue'
	import TimerPresetsSection from '@/core/activityHistory/component/TimerPresetsSection.vue'
	import { requestNotificationPermission, showNotification } from '@/_common/utils/notifications.ts'
	import { Time } from '@/_common/dto/dto/Time.ts'
	import { timeInUserZone } from '@/_common/composable/general/useUserClock.ts'
	import { computed, onMounted, onUnmounted, ref } from 'vue'
	import TimePicker from '@/_common/component/dateTime/TimePicker.vue'
	import TimeDisplayWithProgress from '@/_common/component/dateTime/TimeDisplayWithProgress.vue'
	import TimerControls from '@/core/activityHistory/component/TimerControls.vue'
	import { TimePrecise } from '@/_common/dto/dto/TimePrecise.ts'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
	import { useTimerNotifications } from '@/core/activity/composable/useTimerNotifications.ts'
	import type { TimerPreset } from '@/core/activityHistory/dto/response/TimerPreset.ts'
	import type { ActivitySelection } from '@/core/activity/dto/dto/ActivitySelection.ts'
	import { useDialog } from '@/_common/composable/general/useDialog.ts'
	import { useI18n } from 'vue-i18n'

	const {
		activityId = null,
		activityName = '',
		compact = false,
		initialDuration,
		autoStart = false,
	} = defineProps<{
		activityId?: number | null
		activityName?: string
		compact?: boolean
		initialDuration?: Time
		autoStart?: boolean
	}>()

	const emit = defineEmits<{
		started: [actualStartTime: Time]
		done: [startTimestamp: Date, length: Time]
	}>()

	const { showErrorSnackbar } = useSnackbar()
	const { triggerTimerEndNotification, stopAllNotifications } = useTimerNotifications()
	const { openDialog } = useDialog()
	const { t } = useI18n()

	const activitySelectionForm = ref<InstanceType<typeof ActivitySelectionForm>>()

	const timeInputVisible = ref(true)
	const initialTime = ref(initialDuration ? new Time(initialDuration.hours, initialDuration.minutes) : new Time())
	const paused = ref(false)
	const intervalId = ref<number | undefined>(undefined)
	const startTimestamp = ref(new Date())
	const formDisabled = ref(false)
	const selectedActivityId = ref<number | null>(activityId)
	const selection = ref<ActivitySelection | null>(null)
	// Frozen at start: the selection form is hidden while the timer runs, and the name has to survive
	// until the save dialog.
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

	void requestNotificationPermission()

	onMounted(() => {
		if (autoStart && activityId) {
			void start()
		}
	})

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
				selectedActivityName.value = selection.value?.activityName || activityName
				timeInputVisible.value = false
				const durationMs = initialTime.value.getInSeconds * 1000
				const currentTime = Date.now()
				now.value = currentTime
				endsAt.value = currentTime + durationMs
				startUpdateInterval()
				scheduleNotificationTimeout()
				// `startTimestamp` is an instant. Read in the user's zone, because this is persisted as
				// the hour the work actually happened at.
				emit('started', timeInUserZone(startTimestamp.value))
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

	async function stop(automatic: boolean) {
		clearInterval(intervalId.value)
		clearTimeout(notificationTimeoutId.value)
		intervalId.value = undefined
		notificationTimeoutId.value = undefined

		const name = selectedActivityName.value
		timeInputVisible.value = true
		if (automatic) {
			triggerTimerEndNotification('Timer ended!', name)
			void showNotification('Timer ended', `Your timer for ${name} ended it ran for ${timePassed().getNice}`)
		}
		if (timePassed().getInMinutes > 0) {
			if (!activityId) {
				const timeLength = timePassed()
				const result = await openDialog<boolean>({
					component: SaveActivityBody,
					componentProps: { activity: name, timeSpent: timeLength },
					dialogProps: { title: t('activities.recordNewActivity') },
				})
				if (result) {
					await activitySelectionForm.value!.saveActivityToHistory(startTimestamp.value, timeLength)
				}
				resetTimer()
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

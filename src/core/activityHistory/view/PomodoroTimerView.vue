<template>
	<VRow
		:class="compact ? undefined : 'py-4'"
		justify="center"
		align="center"
		noGutters
	>
		<VCol
			cols="12"
			:sm="compact ? undefined : 10"
			:md="compact ? undefined : 10"
			:lg="compact ? undefined : 10"
			:class="compact ? undefined : 'mt-3 mt-md-0'"
		>
			<VCard
				:elevation="compact ? 0 : 3"
				:class="compact ? 'pa-0' : 'pa-3 pa-md-6'"
			>
				<VCardTitle class="text-h5 text-center pb-3">Pomodoro Timer</VCardTitle>
				<div v-if="timeInputVisible">
					<div class="d-flex justify-center ga-2 mb-3">
						<VBtn
							variant="tonal"
							prependIcon="sliders"
							color="secondaryOutline"
							@click="openPresets"
						>
							{{ i18n.t('controls.presets') }}
						</VBtn>
						<VBtn
							variant="tonal"
							prependIcon="clock-rotate-left"
							@click="resetPickersToDefault"
						>
							Defaults
						</VBtn>
					</div>
					<div class="d-flex flex-wrap justify-center ga-3">
						<SubtleCard
							color="primary-accent"
							borderOpacity="high"
							class="d-flex align-center ga-3 pa-3"
						>
							<VSheet
								color="blue"
								rounded="sm"
								width="4"
								height="36"
								class="flex-shrink-0"
							></VSheet>
							<span class="text-body-2 font-weight-medium flex-shrink-0">
								{{ i18n.t('pomodoroTimer.focus') }}
							</span>
							<TimePicker
								v-model="focusInitialTime"
								label=""
								color="primaryOutline"
								viewMode="minute"
								hideDetails
							></TimePicker>
						</SubtleCard>
						<SubtleCard
							color="primary-accent"
							borderOpacity="high"
							class="d-flex align-center ga-3 pa-3"
						>
							<VSheet
								color="yellow-lighten-2"
								rounded="sm"
								width="4"
								height="36"
								class="flex-shrink-0"
							></VSheet>
							<span class="text-body-2 font-weight-medium flex-shrink-0">
								{{ i18n.t('pomodoroTimer.shortRest') }}
							</span>
							<TimePicker
								v-model="shortRestInitialTime"
								label=""
								color="primaryOutline"
								viewMode="minute"
								hideDetails
							></TimePicker>
						</SubtleCard>
						<SubtleCard
							color="primary-accent"
							borderOpacity="high"
							class="d-flex align-center ga-3 pa-3"
						>
							<VSheet
								color="deep-purple-lighten-1"
								rounded="sm"
								width="4"
								height="36"
								class="flex-shrink-0"
							></VSheet>
							<span class="text-body-2 font-weight-medium flex-shrink-0">
								{{ i18n.t('pomodoroTimer.longRest') }}
							</span>
							<TimePicker
								v-model="longRestInitialTime"
								label=""
								color="primaryOutline"
								viewMode="minute"
								hideDetails
							></TimePicker>
						</SubtleCard>
					</div>
					<SubtleCard
						color="primary-accent"
						borderOpacity="high"
						class="mt-3 d-flex flex-column flex-md-row justify-center ga-2 ga-md-3 pa-2 mx-auto"
						style="max-width: fit-content !important"
					>
						<div class="d-flex ga-3 align-center">
							<h4>{{ i18n.t('pomodoroTimer.numberOfFocusIntervalsInCycle') }}</h4>
							<VSelect
								v-model="numberOfFocusPeriodsInCycle"
								class="flex-0-1"
								:items="[2, 3, 4, 5, 6]"
								hideDetails
								:clearable="false"
							></VSelect>
						</div>
						<div class="d-flex ga-3 justify-end align-center">
							<h4>{{ i18n.t('pomodoroTimer.numberOfCycles') }}</h4>
							<VSelect
								v-model="numberOfCycles"
								class="flex-0-1"
								:items="[1, 2, 3, 4, 5, 6]"
								hideDetails
								:clearable="false"
							></VSelect>
						</div>
					</SubtleCard>
				</div>
				<div
					v-else
					class="d-flex align-center"
				>
					<TimeDisplayWithProgress
						:timeRemainingObject="timeDisplayObject.timeRemainingObject"
						:timeInitialObject="timeDisplayObject.timeInitialObject"
						:whatToShow="['minutes', 'seconds']"
						:color="timeDisplayObject.color"
						:title="timeDisplayObject.title"
					></TimeDisplayWithProgress>
				</div>
				<TimerControls
					class="mt-4 mb-5"
					:paused="paused"
					:intervalId="intervalId"
					@start="start"
					@pause="pause"
					@stop="stop"
				></TimerControls>
				<hr />
				<!-- Activity selection forms (before start) -->
				<VRow
					v-show="timeInputVisible"
					class="mt-1"
				>
					<VCol
						cols="12"
						sm="6"
					>
						<div class="mb-1 d-flex ga-1 align-center">
							<VIcon
								icon="fas fa-bullseye"
								size="20"
							></VIcon>
							<h3 class="text-h6">
								{{ i18n.t('pomodoroTimer.focusActivity') }}
							</h3>
						</div>
						<ActivitySelectionForm
							v-if="!activityId"
							ref="mainActivitySelectionForm"
							v-model:activityId="focusActivityId"
							v-model:selection="focusSelection"
							:formDisabled="formDisabled"
						></ActivitySelectionForm>
					</VCol>
					<VCol
						cols="12"
						sm="6"
					>
						<div class="mb-1 d-flex ga-1 align-center">
							<VIcon
								icon="fas fa-mug-hot"
								size="20"
							></VIcon>
							<h3 class="text-h6">
								{{ i18n.t('pomodoroTimer.restActivity') }} ({{ i18n.t('general.optional') }})
							</h3>
						</div>
						<ActivitySelectionForm
							v-model:activityId="restActivityId"
							v-model:selection="restSelection"
							:formDisabled="formDisabled"
							mode="optional"
						></ActivitySelectionForm>
					</VCol>
				</VRow>
				<!-- Activity names display (after start) -->
				<div
					v-show="!timeInputVisible"
					class="d-flex flex-wrap justify-center ga-3 mt-3"
				>
					<VChip
						color="primary"
						variant="tonal"
						size="large"
					>
						<VIcon
							icon="fas fa-bullseye"
							start
						></VIcon>
						{{ focusActivityName }}
					</VChip>
					<VChip
						v-if="restSelection?.activityName"
						color="secondary"
						variant="tonal"
						size="large"
					>
						<VIcon
							icon="fas fa-mug-hot"
							start
						></VIcon>
						{{ restSelection?.activityName }}
					</VChip>
				</div>
				<PomodoroPresetsDialog
					ref="presetsDialog"
					@select="selectPreset"
				></PomodoroPresetsDialog>
			</VCard>
		</VCol>
	</VRow>
</template>
<script setup lang="ts">
	import ActivitySelectionForm from '@/core/activity/component/ActivitySelectionForm.vue'
	import SaveActivityBody from '@/core/activity/component/SaveActivityBody.vue'
	import { requestNotificationPermission, showNotification } from '@/_common/utils/notifications.ts'
	import { Time } from '@/_common/dto/dto/Time.ts'
	import { timeInUserZone } from '@/_common/composable/general/useUserClock.ts'
	import { computed, onUnmounted, ref } from 'vue'
	import TimerControls from '@/core/activityHistory/component/TimerControls.vue'
	import TimePicker from '@/_common/component/dateTime/TimePicker.vue'
	import { useI18n } from 'vue-i18n'
	import TimeDisplayWithProgress from '@/_common/component/dateTime/TimeDisplayWithProgress.vue'
	import { TimePrecise } from '@/_common/dto/dto/TimePrecise.ts'
	import PomodoroPresetsDialog from '@/core/activityHistory/component/PomodoroPresetsDialog.vue'
	import { useTimerNotifications } from '@/core/activity/composable/useTimerNotifications.ts'
	import type { ActivitySelection } from '@/core/activity/dto/dto/ActivitySelection.ts'
	import { useSaveActivityToHistory } from '@/core/activityHistory/composable/useSaveActivityToHistory.ts'
	import SubtleCard from '@/_common/component/feedback/SubtleCard.vue'
	import { useDialog } from '@/_common/composable/general/useDialog.ts'

	const {
		activityId = null,
		activityName = '',
		compact = false,
	} = defineProps<{
		activityId?: number | null
		// When the caller pins the activity (`activityId`), it is also the only one who knows its name —
		// the selection form is not rendered at all in that case. The template used to read an
		// `activityName` that was never declared.
		activityName?: string
		compact?: boolean
	}>()
	const emit = defineEmits<{
		started: [actualStartTime: Time]
		done: [startTimestamp: Date, length: Time]
	}>()
	const DEFAULT_FOCUS_TIME = new Time(0, 25)
	const DEFAULT_SHORT_REST_TIME = new Time(0, 5)
	const DEFAULT_LONG_REST_TIME = new Time(0, 15)

	const i18n = useI18n()
	const { triggerTimerEndNotification, stopAllNotifications, playNotificationSound, startTitleAnimation } =
		useTimerNotifications()
	const { openDialog } = useDialog()
	const { saveActivityToHistory } = useSaveActivityToHistory()

	// Only the focus form is still reached into, and only for `validate()` — the rest activity is
	// optional, so there is nothing to validate on it.
	const mainActivitySelectionForm = ref<InstanceType<typeof ActivitySelectionForm>>()
	const presetsDialog = ref<InstanceType<typeof PomodoroPresetsDialog>>()

	const focusInitialTime = ref(new Time(DEFAULT_FOCUS_TIME.hours, DEFAULT_FOCUS_TIME.minutes))
	const shortRestInitialTime = ref(new Time(DEFAULT_SHORT_REST_TIME.hours, DEFAULT_SHORT_REST_TIME.minutes))
	const longRestInitialTime = ref(new Time(DEFAULT_LONG_REST_TIME.hours, DEFAULT_LONG_REST_TIME.minutes))
	const focusTimeElapsed = ref(0)
	const restTimeElapsed = ref(0)

	const numberOfCycles = ref(2)
	const currentCycle = ref(1)
	const numberOfFocusPeriodsInCycle = ref(4)
	const currentFocusPeriod = ref(1)
	const isFocus = ref(true)
	const isEndOfCycle = computed(() => currentFocusPeriod.value === numberOfFocusPeriodsInCycle.value)

	// Timestamp-based timer state
	const endsAt = ref<number | null>(null)
	const pausedRemaining = ref<number | null>(null)
	const phaseStartedAt = ref<number | null>(null)
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

	const currentTimerType = computed(() => {
		if (isFocus.value) {
			return 'focus'
		} else if (isEndOfCycle.value) {
			return 'longBreak'
		} else {
			return 'shortBreak'
		}
	})

	const timeDisplayObject = computed(() => {
		let timeInitialObject: Time
		let color: string
		let title: string
		switch (currentTimerType.value) {
			case 'focus':
				timeInitialObject = focusInitialTime.value
				color = 'blue'
				title = i18n.t('pomodoroTimer.focus')
				break
			case 'shortBreak':
				timeInitialObject = shortRestInitialTime.value
				color = 'yellow-lighten-2'
				title = i18n.t('pomodoroTimer.shortRest')
				break
			case 'longBreak':
				timeInitialObject = longRestInitialTime.value
				color = 'deep-purple-lighten-1'
				title = i18n.t('pomodoroTimer.longRest')
				break
		}
		const timeRemainingObject = TimePrecise.fromSeconds(timeRemaining.value)
		return { timeRemainingObject, timeInitialObject, color, title }
	})

	const startTimestamp = ref(new Date())
	const timeInputVisible = ref(true)
	const paused = ref(false)
	const intervalId = ref<number | undefined>(undefined)
	const formDisabled = ref(false)

	const focusActivityId = ref<number | null>(activityId)
	const restActivityId = ref<number | null>(null)
	const focusSelection = ref<ActivitySelection | null>(null)
	const restSelection = ref<ActivitySelection | null>(null)

	const focusActivityName = computed(() => (activityId ? activityName : (focusSelection.value?.activityName ?? '')))

	void requestNotificationPermission()

	async function start() {
		if (paused.value) {
			resume()
		} else {
			const validationResult = await mainActivitySelectionForm.value?.validate()
			if (!validationResult || validationResult.length === 0) {
				formDisabled.value = true
				startTimestamp.value = new Date()
				timeInputVisible.value = false
				startPhase(focusInitialTime.value.getInSeconds)
				// `startTimestamp` is an instant. Read in the user's zone, because this is persisted as
				// the hour the work actually happened at.
				emit('started', timeInUserZone(startTimestamp.value))
			}
		}
	}

	function startPhase(durationSeconds: number) {
		const currentTime = Date.now()
		now.value = currentTime
		phaseStartedAt.value = currentTime
		endsAt.value = currentTime + durationSeconds * 1000
		startUpdateInterval()
		schedulePhaseEndTimeout()
	}

	function pause() {
		clearInterval(intervalId.value)
		clearTimeout(notificationTimeoutId.value)
		intervalId.value = undefined
		notificationTimeoutId.value = undefined

		// Save elapsed time for current phase
		if (phaseStartedAt.value !== null) {
			const elapsedMs = Date.now() - phaseStartedAt.value
			if (isFocus.value) {
				focusTimeElapsed.value += Math.floor(elapsedMs / 1000)
			} else {
				restTimeElapsed.value += Math.floor(elapsedMs / 1000)
			}
		}

		if (endsAt.value !== null) {
			pausedRemaining.value = endsAt.value - Date.now()
			endsAt.value = null
		}
		phaseStartedAt.value = null
		paused.value = true
	}

	function resume() {
		paused.value = false
		const currentTime = Date.now()
		now.value = currentTime
		phaseStartedAt.value = currentTime

		if (pausedRemaining.value !== null) {
			endsAt.value = currentTime + pausedRemaining.value
			pausedRemaining.value = null
		}
		startUpdateInterval()
		schedulePhaseEndTimeout()
	}

	function startUpdateInterval() {
		intervalId.value = setInterval(() => {
			now.value = Date.now()
		}, 250)
	}

	function schedulePhaseEndTimeout() {
		if (endsAt.value === null) return
		const delay = endsAt.value - Date.now()
		if (delay > 0) {
			notificationTimeoutId.value = setTimeout(() => {
				onPhaseEnd()
			}, delay)
		}
	}

	function onPhaseEnd() {
		clearInterval(intervalId.value)
		clearTimeout(notificationTimeoutId.value)
		intervalId.value = undefined
		notificationTimeoutId.value = undefined

		// Save elapsed time for completed phase
		if (phaseStartedAt.value !== null) {
			const elapsedMs = Date.now() - phaseStartedAt.value
			if (isFocus.value) {
				focusTimeElapsed.value += Math.floor(elapsedMs / 1000)
			} else {
				restTimeElapsed.value += Math.floor(elapsedMs / 1000)
			}
			phaseStartedAt.value = null
		}

		// Show notification for phase end with context
		const cycleInfo = `Cycle ${currentCycle.value}/${numberOfCycles.value}`
		const focusInfo = `Focus ${currentFocusPeriod.value}/${numberOfFocusPeriodsInCycle.value}`

		playNotificationSound()
		switch (currentTimerType.value) {
			case 'focus':
				startTitleAnimation(`Focus ended! | ${cycleInfo}`, `Time for a break`)
				void showNotification(
					'Focus period ended',
					`${focusActivityName.value} - ${focusInfo} | ${cycleInfo}. Time for a break!`,
				)
				break
			case 'shortBreak':
				startTitleAnimation(`Break ended! | ${cycleInfo}`, `Time to focus`)
				void showNotification(
					'Short break ended',
					`${cycleInfo} - Time to focus on ${focusActivityName.value}!`,
				)
				break
			case 'longBreak':
				startTitleAnimation(`Long break ended!`, `Starting cycle ${currentCycle.value + 1}`)
				void showNotification(
					'Long break ended',
					`Cycle ${currentCycle.value} complete. Time for cycle ${currentCycle.value + 1}!`,
				)
				break
		}

		// Transition to next phase
		isFocus.value = !isFocus.value

		if (currentCycle.value === numberOfCycles.value && isEndOfCycle.value && !isFocus.value) {
			stop(true)
		} else {
			let nextDuration: number
			if (isFocus.value) {
				nextDuration = focusInitialTime.value.getInSeconds
				if (isEndOfCycle.value) {
					currentFocusPeriod.value = 1
				} else {
					currentFocusPeriod.value++
				}
			} else {
				if (isEndOfCycle.value) {
					nextDuration = longRestInitialTime.value.getInSeconds
					currentCycle.value++
				} else {
					nextDuration = shortRestInitialTime.value.getInSeconds
				}
			}
			startPhase(nextDuration)
		}
	}

	async function stop(automatic = false) {
		clearInterval(intervalId.value)
		clearTimeout(notificationTimeoutId.value)
		intervalId.value = undefined
		notificationTimeoutId.value = undefined

		// Save any remaining elapsed time
		if (phaseStartedAt.value !== null) {
			const elapsedMs = Date.now() - phaseStartedAt.value
			if (isFocus.value) {
				focusTimeElapsed.value += Math.floor(elapsedMs / 1000)
			} else {
				restTimeElapsed.value += Math.floor(elapsedMs / 1000)
			}
			phaseStartedAt.value = null
		}

		const timeSpent = Time.fromSeconds(focusTimeElapsed.value)
		const restTime = Time.fromSeconds(restTimeElapsed.value)
		const restActivityName = restSelection.value?.activityName ?? ''

		if (automatic) {
			const completedCycles = currentCycle.value
			triggerTimerEndNotification(
				`🍅 Pomodoro complete! | ${completedCycles} cycle${completedCycles > 1 ? 's' : ''}`,
				`${focusActivityName.value} - ${timeSpent.getNice}`,
			)
			void showNotification(
				'Pomodoro complete!',
				`${completedCycles} cycle${completedCycles > 1 ? 's' : ''} done! Focused on ${focusActivityName.value} for ${timeSpent.getNice}${restActivityName ? `, rested with ${restActivityName}` : ''} for ${restTime.getNice}`,
			)
		}

		if (!activityId) {
			const result = await openDialog<boolean>({
				component: SaveActivityBody,
				componentProps: { activity: focusActivityName.value, timeSpent },
				dialogProps: { title: i18n.t('activities.recordNewActivity') },
			})
			if (result) {
				saveActivity()
			}
			resetTimer()
		} else {
			emit('done', startTimestamp.value, Time.fromSeconds(focusTimeElapsed.value))
		}
	}

	function resetTimer() {
		paused.value = false
		intervalId.value = undefined
		notificationTimeoutId.value = undefined
		formDisabled.value = false
		timeInputVisible.value = true
		focusTimeElapsed.value = 0
		restTimeElapsed.value = 0
		currentCycle.value = 1
		currentFocusPeriod.value = 1
		isFocus.value = true
		endsAt.value = null
		pausedRemaining.value = null
		phaseStartedAt.value = null
		stopAllNotifications()
	}

	function resetPickersToDefault() {
		focusInitialTime.value = new Time(DEFAULT_FOCUS_TIME.hours, DEFAULT_FOCUS_TIME.minutes)
		shortRestInitialTime.value = new Time(DEFAULT_SHORT_REST_TIME.hours, DEFAULT_SHORT_REST_TIME.minutes)
		longRestInitialTime.value = new Time(DEFAULT_LONG_REST_TIME.hours, DEFAULT_LONG_REST_TIME.minutes)
	}

	// Two records, one per activity form: the focus activity for the time actually focused, and — only
	// if one was picked and any rest time accrued — the rest activity for the rest.
	function saveActivity() {
		if (!activityId) {
			void saveActivityToHistory(
				focusActivityId.value,
				focusActivityName.value,
				startTimestamp.value,
				Time.fromSeconds(focusTimeElapsed.value),
			)
		}
		if (restActivityId.value != null && restTimeElapsed.value > 0) {
			void saveActivityToHistory(
				restActivityId.value,
				restSelection.value?.activityName ?? '',
				startTimestamp.value,
				Time.fromSeconds(restTimeElapsed.value),
			)
		}
	}

	function openPresets() {
		presetsDialog.value?.open()
	}

	function selectPreset(preset: {
		focusTime: Time
		shortRestTime: Time
		longRestTime: Time
		numberOfFocusPeriodsInCycle: number
		numberOfCycles: number
		focusActivityId: number | null
		restActivityId: number | null
	}) {
		focusInitialTime.value = preset.focusTime
		shortRestInitialTime.value = preset.shortRestTime
		longRestInitialTime.value = preset.longRestTime
		numberOfFocusPeriodsInCycle.value = preset.numberOfFocusPeriodsInCycle
		numberOfCycles.value = preset.numberOfCycles
		if (preset.focusActivityId) {
			focusActivityId.value = preset.focusActivityId
		}
		if (preset.restActivityId) {
			restActivityId.value = preset.restActivityId
		}
	}

	onUnmounted(() => {
		clearInterval(intervalId.value)
		clearTimeout(notificationTimeoutId.value)
	})
</script>
<style scoped>
	.borderGrey {
		border: 1px solid darkgray !important;
	}
</style>

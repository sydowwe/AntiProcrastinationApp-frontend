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
				<VCardTitle class="text-h5 text-center pb-3">{{ i18n.t('history.pomodoro.title') }}</VCardTitle>
				<PomodoroSetupPanel
					v-if="timeInputVisible"
					v-model:focusTime="focusInitialTime"
					v-model:shortRestTime="shortRestInitialTime"
					v-model:longRestTime="longRestInitialTime"
					v-model:numberOfCycles="numberOfCycles"
					v-model:numberOfFocusPeriodsInCycle="numberOfFocusPeriodsInCycle"
					@openPresets="openPresets"
					@resetToDefault="resetPickersToDefault"
				></PomodoroSetupPanel>
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
					:running
					:paused
					@start="start"
					@pause="pause"
					@stop="stop"
				></TimerControls>
				<hr />
				<PomodoroActivityPanel
					ref="activityPanel"
					:activityId
					:formDisabled
					:timeInputVisible
					:focusActivityName
					:restActivityName
					v-model:focusActivityId="focusActivityId"
					v-model:focusSelection="focusSelection"
					v-model:restActivityId="restActivityId"
					v-model:restSelection="restSelection"
				></PomodoroActivityPanel>
				<PomodoroPresetsDialog
					ref="presetsDialog"
					@select="selectPreset"
				></PomodoroPresetsDialog>
			</VCard>
		</VCol>
	</VRow>
</template>
<script setup lang="ts">
	import SaveActivityBody from '@/core/activity/component/SaveActivityBody.vue'
	import { requestNotificationPermission } from '@/_common/utils/notifications.ts'
	import { Time } from '@/_common/dto/dto/Time.ts'
	import { timeInUserZone } from '@/_common/composable/general/useUserClock.ts'
	import { computed, ref, watch } from 'vue'
	import TimerControls from '@/core/activityHistory/component/TimerControls.vue'
	import { useI18n } from 'vue-i18n'
	import TimeDisplayWithProgress from '@/_common/component/dateTime/TimeDisplayWithProgress.vue'
	import { TimePrecise } from '@/_common/dto/dto/TimePrecise.ts'
	import PomodoroPresetsDialog from '@/core/activityHistory/component/PomodoroPresetsDialog.vue'
	import PomodoroSetupPanel from '@/core/activityHistory/component/PomodoroSetupPanel.vue'
	import PomodoroActivityPanel from '@/core/activityHistory/component/PomodoroActivityPanel.vue'
	import type { ActivitySelection } from '@/core/activity/dto/dto/ActivitySelection.ts'
	import { useSaveActivityToHistory } from '@/core/activityHistory/composable/useSaveActivityToHistory.ts'
	import { useDialog } from '@/_common/composable/general/useDialog.ts'
	import {
		pomodoroPhaseOf,
		useRunningTimerStore,
		type PomodoroSession,
	} from '@/core/activityHistory/store/runningTimerStore.ts'
	import { useTimerSessionGuard } from '@/core/activityHistory/composable/useTimerSessionGuard.ts'

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
	const { openDialog } = useDialog()
	const { saveActivityToHistory } = useSaveActivityToHistory()
	const store = useRunningTimerStore()
	const { ensureFreeToStart } = useTimerSessionGuard()

	const activityPanel = ref<InstanceType<typeof PomodoroActivityPanel>>()
	const presetsDialog = ref<InstanceType<typeof PomodoroPresetsDialog>>()

	// The pickers. Pre-start settings only: once a session exists these are seeded from it and the
	// inputs are off screen, because the running cycle's durations are the ones it was started with.
	const focusInitialTime = ref(new Time(DEFAULT_FOCUS_TIME.hours, DEFAULT_FOCUS_TIME.minutes))
	const shortRestInitialTime = ref(new Time(DEFAULT_SHORT_REST_TIME.hours, DEFAULT_SHORT_REST_TIME.minutes))
	const longRestInitialTime = ref(new Time(DEFAULT_LONG_REST_TIME.hours, DEFAULT_LONG_REST_TIME.minutes))
	const numberOfCycles = ref(2)
	const numberOfFocusPeriodsInCycle = ref(4)

	const focusActivityId = ref<number | null>(activityId)
	const restActivityId = ref<number | null>(null)
	const focusSelection = ref<ActivitySelection | null>(null)
	const restSelection = ref<ActivitySelection | null>(null)

	/**
	 * The pomodoro this instance owns, or null. Every part of the cycle that used to be a local ref —
	 * the phase, the counters, the two elapsed totals — is in the store, so the cycle keeps advancing
	 * and keeps ringing while this view is not mounted, and comes back intact after a reload.
	 */
	const pinnedActivityId = computed(() => activityId ?? null)
	const session = computed(() => store.sessionFor('pomodoro', pinnedActivityId.value))

	const running = computed(() => session.value !== null && !session.value.ended)
	const paused = computed(() => session.value?.paused === true)
	const timeInputVisible = computed(() => session.value === null)
	const formDisabled = computed(() => session.value !== null)

	const timeRemaining = computed(() => (session.value === null ? 0 : Math.ceil(store.remainingMs / 1000)))
	const currentTimerType = computed(() => (session.value === null ? 'focus' : pomodoroPhaseOf(session.value)))

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

	const focusActivityName = computed(() => {
		if (activityId) return activityName
		return session.value?.activityName || (focusSelection.value?.activityName ?? '')
	})
	// Off the session while one runs: the rest form is unmounted then, so its selection is null.
	const restActivityName = computed(
		() => session.value?.restActivityName || (restSelection.value?.activityName ?? ''),
	)

	void requestNotificationPermission()

	// Adopting a session means adopting the cycle it was started with — the progress ring is drawn
	// against these durations, and the phase colours pick between them.
	watch(
		session,
		current => {
			if (current === null) return
			focusInitialTime.value = Time.fromMinutes(Math.round(current.focusMs / 60_000))
			shortRestInitialTime.value = Time.fromMinutes(Math.round(current.shortRestMs / 60_000))
			longRestInitialTime.value = Time.fromMinutes(Math.round(current.longRestMs / 60_000))
			numberOfFocusPeriodsInCycle.value = current.focusPeriodsPerCycle
			numberOfCycles.value = current.totalCycles
			if (current.activityId !== null) focusActivityId.value = current.activityId
			restActivityId.value = current.restActivityId
		},
		{ immediate: true },
	)

	/**
	 * An ended session is not a finished one — it still has to be written down. This fires for the
	 * Stop button, for the last cycle completing with the view on screen, and for a mount that finds
	 * a pomodoro the store ended while the app was away.
	 */
	let finishing = false
	watch(
		() => session.value?.ended === true,
		ended => {
			if (ended) void finishSession()
		},
		{ immediate: true },
	)

	async function start() {
		if (paused.value) {
			store.resumeSession()
			return
		}
		const validationResult = await activityPanel.value?.validate()
		if (!validationResult || validationResult.length === 0) {
			// Last, and after validation on purpose: this prompt discards somebody else's session, so
			// it must not be asked for a start that is then going to fail anyway.
			if (!(await ensureFreeToStart('pomodoro', pinnedActivityId.value))) return
			const started = store.startPomodoro({
				pinnedActivityId: pinnedActivityId.value,
				activityId: activityId ?? focusActivityId.value,
				activityName: activityId ? activityName : (focusSelection.value?.activityName ?? ''),
				focusMs: focusInitialTime.value.getInSeconds * 1000,
				shortRestMs: shortRestInitialTime.value.getInSeconds * 1000,
				longRestMs: longRestInitialTime.value.getInSeconds * 1000,
				focusPeriodsPerCycle: numberOfFocusPeriodsInCycle.value,
				totalCycles: numberOfCycles.value,
				restActivityId: restActivityId.value,
				restActivityName: restSelection.value?.activityName ?? '',
			})
			// `startedAtEpoch` is an instant. Read in the user's zone, because this is persisted as
			// the hour the work actually happened at.
			emit('started', timeInUserZone(new Date(started.startedAtEpoch)))
		}
	}

	function pause() {
		store.pauseSession()
	}

	function stop() {
		store.endSession(false)
	}

	async function finishSession() {
		const current = session.value
		if (current === null || !current.ended || finishing) return
		finishing = true
		try {
			const timeSpent = Time.fromSeconds(Math.floor(current.focusElapsedMs / 1000))
			const startTimestamp = new Date(current.startedAtEpoch)
			const name = current.activityName
			if (activityId) {
				store.clearSession()
				emit('done', startTimestamp, timeSpent)
				return
			}
			const result = await openDialog<boolean>({
				component: SaveActivityBody,
				componentProps: { activity: name, timeSpent },
				dialogProps: { title: i18n.t('activities.recordNewActivity') },
			})
			if (result) {
				saveActivity(current, startTimestamp, timeSpent)
			}
			// Only now: a reload while the save dialog is open should find the session still there.
			store.clearSession()
		} finally {
			finishing = false
		}
	}

	// Two records, one per activity form: the focus activity for the time actually focused, and — only
	// if one was picked and any rest time accrued — the rest activity for the rest.
	function saveActivity(current: PomodoroSession, startTimestamp: Date, timeSpent: Time) {
		void saveActivityToHistory(current.activityId, current.activityName, startTimestamp, timeSpent)
		if (current.restActivityId != null && current.restElapsedMs > 0) {
			void saveActivityToHistory(
				current.restActivityId,
				current.restActivityName,
				startTimestamp,
				Time.fromSeconds(Math.floor(current.restElapsedMs / 1000)),
			)
		}
	}

	function resetPickersToDefault() {
		focusInitialTime.value = new Time(DEFAULT_FOCUS_TIME.hours, DEFAULT_FOCUS_TIME.minutes)
		shortRestInitialTime.value = new Time(DEFAULT_SHORT_REST_TIME.hours, DEFAULT_SHORT_REST_TIME.minutes)
		longRestInitialTime.value = new Time(DEFAULT_LONG_REST_TIME.hours, DEFAULT_LONG_REST_TIME.minutes)
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
</script>

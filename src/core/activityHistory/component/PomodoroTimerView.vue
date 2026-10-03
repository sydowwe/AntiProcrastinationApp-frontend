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
					:presets
					@applyPreset="selectPreset"
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
					@loaded="presets = $event"
				></PomodoroPresetsDialog>
			</VCard>
		</VCol>
	</VRow>
</template>
<script setup lang="ts">
	import PomodoroSaveBody from '@/core/activityHistory/component/PomodoroSaveBody.vue'
	import { pomodoroOutcomeSummary } from '@/core/activityHistory/store/pomodoroSessionLog.ts'
	import { pomodoroSessionRequest } from '@/core/activityHistory/store/timerSessionRequest.ts'
	import type { ActivityHistorySessionRequest } from '@/core/activityHistory/dto/request/ActivityHistorySessionRequest.ts'
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
	import type { PomodoroTimerPreset } from '@/core/activityHistory/dto/response/PomodoroTimerPreset.ts'
	import type { ActivitySelection } from '@/core/activity/dto/dto/ActivitySelection.ts'
	import { useSaveActivityToHistory } from '@/core/activityHistory/composable/useSaveActivityToHistory.ts'
	import { useDialog } from '@/_common/composable/general/useDialog.ts'
	import {
		pomodoroPhaseOf,
		useRunningTimerStore,
		type PomodoroSession,
	} from '@/core/activityHistory/store/runningTimerStore.ts'
	import { useTimerSessionGuard } from '@/core/activityHistory/composable/useTimerSessionGuard.ts'
	import { useSessionLength } from '@/core/activityHistory/composable/useSessionLength.ts'

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
		/**
		 * `length` is the focus total, which the embedder quotes. `session` is the whole sitting, rest rows
		 * included, as the routed save writes it, or null when it cannot be one (`pomodoroSessionRequest`).
		 */
		done: [startTimestamp: Date, length: Time, session: ActivityHistorySessionRequest | null]
	}>()
	const DEFAULT_FOCUS_TIME = new Time(0, 25)
	const DEFAULT_SHORT_REST_TIME = new Time(0, 5)
	const DEFAULT_LONG_REST_TIME = new Time(0, 15)

	const i18n = useI18n()
	const { openDialog } = useDialog()
	const { saveActivityToHistory, saveSessionToHistory } = useSaveActivityToHistory()
	const store = useRunningTimerStore()
	const { ensureFreeToStart } = useTimerSessionGuard()
	const { sessionLengthFromMs, discardIfTooShort } = useSessionLength()

	const activityPanel = ref<InstanceType<typeof PomodoroActivityPanel>>()
	const presetsDialog = ref<InstanceType<typeof PomodoroPresetsDialog>>()
	// The dialog owns the list and reports every load; the setup panel renders it as chips.
	const presets = ref<PomodoroTimerPreset[]>([])

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
			const timeSpent = sessionLengthFromMs(current.focusElapsedMs)
			const startTimestamp = new Date(current.startedAtEpoch)
			const name = current.activityName
			// Before everything else, embedders included: a session that rounds to nothing has nothing
			// to hand anyone, and the save dialog would offer "done for ?" over a length the API now
			// rejects. Same branch, same wording, in all three capture views.
			if (discardIfTooShort(timeSpent)) {
				store.clearSession()
				return
			}
			if (activityId) {
				store.clearSession()
				emit('done', startTimestamp, timeSpent, pomodoroSessionRequest(current))
				return
			}
			const result = await openDialog<boolean>({
				component: PomodoroSaveBody,
				// `timeSpent` is the authoritative number: the rounded focus total, which the focus rows
				// share out between them (`apportionMinutes`) so they add up to exactly what is quoted.
				componentProps: { activity: name, timeSpent, summary: pomodoroOutcomeSummary(current) },
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

	// One session, written all-or-nothing: a row per focus period against the focus activity and — if
	// one was picked — a row per break against the rest activity, each dated at its real start, all
	// carrying the outcome. The server counts it as one sitting everywhere it counts entries (B3).
	//
	// Not awaited, and the session is cleared straight after, as before: a tab closed mid-request must
	// not offer the same save again, which would be refused as a duplicate (409).
	//
	// The embedded path (`activityId` pinned, `done` emitted above) hands the embedder the same request,
	// and the embedder writes it (OP6). It used to be one summed focus row with no session, so a pomodoro
	// started from a task lost its outcome, its plan and its rest time.
	function saveActivity(current: PomodoroSession, startTimestamp: Date, timeSpent: Time) {
		const request = pomodoroSessionRequest(current)
		if (request !== null) {
			void saveSessionToHistory(request, current.activityName)
			return
		}
		saveSummedRows(current, startTimestamp, timeSpent)
	}

	/**
	 * The save from before sessions existed: the focus total and the rest total as two plain rows, both
	 * dated at the session's start. Only for what `pomodoroSessionRequest` cannot write as a session —
	 * one stored in this browser before the segment log existed, or one too long for a single request.
	 */
	function saveSummedRows(current: PomodoroSession, startTimestamp: Date, timeSpent: Time) {
		void saveActivityToHistory(current.activityId, current.activityName, startTimestamp, timeSpent)
		if (current.restActivityId == null) return
		// The rest record is the fourth zero-length path: `restElapsedMs > 0` let a 20-second break
		// through, which rounded to `{0,0}` and is a 400 now. It is silent on purpose — the focus
		// record is what the user confirmed, and a snackbar about the break they did not ask to log
		// would only confuse it.
		const restSpent = sessionLengthFromMs(current.restElapsedMs)
		if (!restSpent.isNotZero()) return
		void saveActivityToHistory(current.restActivityId, current.restActivityName, startTimestamp, restSpent)
	}

	function resetPickersToDefault() {
		focusInitialTime.value = new Time(DEFAULT_FOCUS_TIME.hours, DEFAULT_FOCUS_TIME.minutes)
		shortRestInitialTime.value = new Time(DEFAULT_SHORT_REST_TIME.hours, DEFAULT_SHORT_REST_TIME.minutes)
		longRestInitialTime.value = new Time(DEFAULT_LONG_REST_TIME.hours, DEFAULT_LONG_REST_TIME.minutes)
	}

	function openPresets() {
		presetsDialog.value?.open()
	}

	/** From the presets dialog and from the setup panel's one-tap chips alike. */
	function selectPreset(preset: PomodoroTimerPreset) {
		focusInitialTime.value = Time.fromMinutes(preset.focusDuration)
		shortRestInitialTime.value = Time.fromMinutes(preset.shortBreakDuration)
		longRestInitialTime.value = Time.fromMinutes(preset.longBreakDuration)
		numberOfFocusPeriodsInCycle.value = preset.focusPeriodInCycleCount
		numberOfCycles.value = preset.numberOfCycles
		if (preset.focusActivity) {
			focusActivityId.value = preset.focusActivity.id
		}
		if (preset.restActivity) {
			restActivityId.value = preset.restActivity.id
		}
	}
</script>

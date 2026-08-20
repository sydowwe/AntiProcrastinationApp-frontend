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
				:running
				:paused
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
	import { requestNotificationPermission } from '@/_common/utils/notifications.ts'
	import { Time } from '@/_common/dto/dto/Time.ts'
	import { timeInUserZone } from '@/_common/composable/general/useUserClock.ts'
	import { computed, onMounted, ref, watch } from 'vue'
	import TimePicker from '@/_common/component/dateTime/TimePicker.vue'
	import TimeDisplayWithProgress from '@/_common/component/dateTime/TimeDisplayWithProgress.vue'
	import TimerControls from '@/core/activityHistory/component/TimerControls.vue'
	import { TimePrecise } from '@/_common/dto/dto/TimePrecise.ts'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
	import type { TimerPreset } from '@/core/activityHistory/dto/response/TimerPreset.ts'
	import type { ActivitySelection } from '@/core/activity/dto/dto/ActivitySelection.ts'
	import { useSaveActivityToHistory } from '@/core/activityHistory/composable/useSaveActivityToHistory.ts'
	import { useDialog } from '@/_common/composable/general/useDialog.ts'
	import { useI18n } from 'vue-i18n'
	import { useRunningTimerStore } from '@/core/activityHistory/store/runningTimerStore.ts'
	import { useTimerSessionGuard } from '@/core/activityHistory/composable/useTimerSessionGuard.ts'

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
	const { openDialog } = useDialog()
	const { t } = useI18n()
	const { saveActivityToHistory } = useSaveActivityToHistory()
	const store = useRunningTimerStore()
	const { ensureFreeToStart } = useTimerSessionGuard()

	const activitySelectionForm = ref<InstanceType<typeof ActivitySelectionForm>>()

	const initialTime = ref(initialDuration ? new Time(initialDuration.hours, initialDuration.minutes) : new Time())
	const selectedActivityId = ref<number | null>(activityId)
	const selection = ref<ActivitySelection | null>(null)

	/**
	 * The countdown this instance owns, or null. The whole state machine — `endsAt`, the paused
	 * remainder, the alarm — lives in the store, so it survives navigation, reload and the dialog
	 * being closed, and it keeps counting down (and still rings) while no timer view is mounted.
	 */
	const pinnedActivityId = computed(() => activityId ?? null)
	const session = computed(() => store.sessionFor('timer', pinnedActivityId.value))

	const running = computed(() => session.value !== null && !session.value.ended)
	const paused = computed(() => session.value?.paused === true)
	// The duration picker is the idle face of this view; a session of any kind — running, paused or
	// waiting to be logged — replaces it with the countdown.
	const timeInputVisible = computed(() => session.value === null)
	const formDisabled = computed(() => session.value !== null)

	const timeRemaining = computed(() => (session.value === null ? 0 : Math.ceil(store.remainingMs / 1000)))
	const timeRemainingObject = computed(() => TimePrecise.fromSeconds(timeRemaining.value))
	const selectedActivityName = computed(() => session.value?.activityName ?? '')

	void requestNotificationPermission()

	// Adopting a session means adopting the numbers it was started with: the progress ring is drawn
	// against `initialTime`, and the activity it logs against has to be the one it was started for.
	watch(
		session,
		current => {
			if (current === null) return
			initialTime.value = Time.fromMinutes(Math.round(current.durationMs / 60_000))
			if (current.activityId !== null) selectedActivityId.value = current.activityId
		},
		{ immediate: true },
	)

	/**
	 * An ended session is not a finished one — it still has to be written down. This fires for the
	 * Stop button, for the countdown reaching zero with the view on screen, and for a mount that
	 * finds a session that ran out (or was stopped) while the app was away.
	 */
	let finishing = false
	watch(
		() => session.value?.ended === true,
		ended => {
			if (ended) void finishSession()
		},
		{ immediate: true },
	)

	onMounted(() => {
		// Not when a session is already here: `autoStart` means "the caller opened this to start
		// timing", and a dialog reopened over a running timer has already had its start.
		if (autoStart && activityId && session.value === null) {
			void start()
		}
	})

	async function start() {
		if (paused.value) {
			store.resumeSession()
			return
		}
		if (initialTime.value.getInSeconds === 0) {
			showErrorSnackbar(t('history.timer.setDurationFirst'))
			return
		}
		const validationResult = await activitySelectionForm.value?.validate()
		if (!validationResult || validationResult.length === 0) {
			// Last, and after validation on purpose: this prompt discards somebody else's session, so
			// it must not be asked for a start that is then going to fail anyway.
			if (!(await ensureFreeToStart('timer', pinnedActivityId.value))) return
			const started = store.startCountdown({
				pinnedActivityId: pinnedActivityId.value,
				activityId: activityId ?? selectedActivityId.value,
				activityName: selection.value?.activityName || activityName,
				durationMs: initialTime.value.getInSeconds * 1000,
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
			const length = timePassed()
			const startTimestamp = new Date(current.startedAtEpoch)
			const name = current.activityName
			// `activityId` off the session, not `selection`: the selection form is unmounted while the
			// countdown runs and a freshly mounted one reports null until its options are back. The
			// session has carried both the id and the name since the moment Start was pressed.
			const targetActivityId = current.activityId
			if (length.getInMinutes <= 0) {
				store.clearSession()
				return
			}
			if (activityId) {
				store.clearSession()
				emit('done', startTimestamp, length)
				return
			}
			const result = await openDialog<boolean>({
				component: SaveActivityBody,
				componentProps: { activity: name, timeSpent: length },
				dialogProps: { title: t('activities.recordNewActivity') },
			})
			if (result) {
				await saveActivityToHistory(targetActivityId, name, startTimestamp, length)
			}
			// Only now: a reload while the save dialog is open should find the session still there.
			store.clearSession()
		} finally {
			finishing = false
		}
	}

	/** How much of the set duration was actually used — the whole of it once it has run out. */
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
</script>

<template>
	<VRow
		justify="center"
		noGutters
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
			<VRow justify="center">
				<VCol
					cols="12"
					sm="11"
					md="10"
					lg="8"
					xl="6"
				>
					<TimeDisplay
						:timeObject="time"
						:whatToShow
					></TimeDisplay>
				</VCol>
			</VRow>
			<TimerControls
				class="mt-6 mb-7"
				:running
				:paused
				@start="start"
				@pause="pause"
				@stop="stop"
			></TimerControls>
			<hr
				class="mb-4"
				v-if="!activityId"
			/>
			<ActivitySelectionForm
				v-if="!activityId"
				ref="activitySelectionForm"
				v-model:activityId="selectedActivityId"
				v-model:selection="selection"
				:formDisabled
			></ActivitySelectionForm>
		</VCol>
	</VRow>
</template>
<script setup lang="ts">
	import ActivitySelectionForm from '@/core/activity/component/ActivitySelectionForm.vue'
	import TimeDisplay from '@/_common/component/dateTime/TimeDisplay.vue'
	import SaveActivityBody from '@/core/activity/component/SaveActivityBody.vue'
	import type { Time } from '@/_common/dto/dto/Time.ts'
	import { timeInUserZone } from '@/_common/composable/general/useUserClock.ts'
	import { computed, ref, watch } from 'vue'
	import TimerControls from '@/core/activityHistory/component/TimerControls.vue'
	import { TimePrecise, type TimePreciseKeys } from '@/_common/dto/dto/TimePrecise.ts'
	import { useDialog } from '@/_common/composable/general/useDialog.ts'
	import { useI18n } from 'vue-i18n'
	import type { ActivitySelection } from '@/core/activity/dto/dto/ActivitySelection.ts'
	import { useSaveActivityToHistory } from '@/core/activityHistory/composable/useSaveActivityToHistory.ts'
	import { useRunningTimerStore } from '@/core/activityHistory/store/runningTimerStore.ts'
	import { useTimerSessionGuard } from '@/core/activityHistory/composable/useTimerSessionGuard.ts'

	const { activityId = null, compact = false } = defineProps<{
		activityId?: number | null
		compact?: boolean
	}>()

	const emit = defineEmits<{
		started: [actualStartTime: Time]
		done: [startTimestamp: Date, length: Time]
	}>()

	const { openDialog } = useDialog()
	const { t } = useI18n()
	const { saveActivityToHistory } = useSaveActivityToHistory()
	const store = useRunningTimerStore()
	const { ensureFreeToStart } = useTimerSessionGuard()

	const activitySelectionForm = ref<InstanceType<typeof ActivitySelectionForm>>()

	const selectedActivityId = ref<number | null>(activityId)
	const selection = ref<ActivitySelection | null>(null)

	/**
	 * The session this instance owns, or null. Nothing about the running stopwatch is held here any
	 * more: the store owns it, so navigating away, reloading, or closing TrackTimeDialog leaves it
	 * running and this view picks it straight back up on the next mount.
	 */
	const pinnedActivityId = computed(() => activityId ?? null)
	const session = computed(() => store.sessionFor('stopwatch', pinnedActivityId.value))

	const elapsedMs = computed(() => (session.value === null ? 0 : store.stopwatchElapsedMs))
	const time = computed(() => TimePrecise.fromSeconds(Math.floor(elapsedMs.value / 1000)))
	const running = computed(() => session.value !== null && !session.value.ended)
	const paused = computed(() => session.value?.paused === true)

	const whatToShow = computed<TimePreciseKeys[]>(() =>
		time.value.hours > 0 ? ['hours', 'minutes', 'seconds'] : ['minutes', 'seconds'],
	)

	// The stopwatch is the one timer whose selection form stays live while it is paused, so this is
	// derived from the session rather than latched at start — a latched flag is a flag that has to be
	// unlatched again on every path out, and a reloaded page would come back with it unset.
	const formDisabled = computed(() => running.value && !paused.value)

	// Adopting a session means adopting the activity it is being logged against — otherwise a
	// reloaded page shows a running stopwatch above an empty selection field and saves against
	// nothing.
	watch(
		session,
		current => {
			if (current !== null && current.activityId !== null) selectedActivityId.value = current.activityId
		},
		{ immediate: true },
	)
	// ...and the reverse, because the selection can still be changed while the stopwatch is paused.
	watch([selectedActivityId, selection], ([id, current]) => {
		const active = session.value
		if (active === null) return
		active.activityId = id
		if (current?.activityName) active.activityName = current.activityName
	})

	/**
	 * An ended session is not a finished one — it still has to be written down. The stopwatch never
	 * runs out by itself, but it can still be found already ended: the tab can be closed between
	 * pressing Stop and answering the save dialog.
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
		const validationResult = await activitySelectionForm.value?.validate()
		if (!validationResult || validationResult.length === 0) {
			// Last, and after validation on purpose: this prompt discards somebody else's session, so
			// it must not be asked for a start that is then going to fail anyway.
			if (!(await ensureFreeToStart('stopwatch', pinnedActivityId.value))) return
			const started = store.startStopwatch({
				pinnedActivityId: pinnedActivityId.value,
				activityId: activityId ?? selectedActivityId.value,
				activityName: selection.value?.activityName ?? '',
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

	/** Reached from the Stop button (through the store) and from a mount that finds an ended session. */
	async function finishSession() {
		const current = session.value
		if (current === null || !current.ended || finishing) return
		finishing = true
		try {
			const length = TimePrecise.fromSeconds(Math.floor(elapsedMs.value / 1000)).toTimeLength
			const startTimestamp = new Date(current.startedAtEpoch)
			const name = current.activityName
			const targetActivityId = current.activityId
			if (activityId) {
				// Pinned by the embedder: it does the recording, so hand the numbers back. Cleared
				// first, so the dialog around us sees the session is over before it reads it.
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
</script>

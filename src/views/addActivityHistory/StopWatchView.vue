<template>
	<VRow
		justify="center"
		noGutters
		class="py-4 my-auto"
	>
		<VCol
			cols="12"
			sm="11"
			md="10"
			lg="7"
			xl="6"
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
						:whatToShow="whatToShow"
					></TimeDisplay>
				</VCol>
			</VRow>
			<TimerControls
				class="mt-6 mb-7"
				:intervalId
				:paused="paused"
				@start="start"
				@pause="pause"
				@stop="stop"
			></TimerControls>
			<hr class="mb-4" />
			<ActivitySelectionForm
				ref="activitySelectionForm"
				v-model:activityId="selectedActivityId"
				:formDisabled="formDisabled"
			></ActivitySelectionForm>
			<SaveActivityDialog
				ref="saveDialog"
				@saved="saveActivity"
				@resetTime="resetTime"
			></SaveActivityDialog>
		</VCol>
	</VRow>
</template>
<script setup lang="ts">
	import ActivitySelectionForm from '../../components/ActivitySelectionForm.vue'
	import TimeDisplay from '@/components/general/dateTime/TimeDisplay.vue'
	import SaveActivityDialog from '../../components/dialogs/SaveActivityDialog.vue'
	import { Time } from '@/dtos/dto/Time.ts'
	import { computed, onMounted, ref } from 'vue'
	import TimerControls from '@/components/addActivityToHistory/TimerControls.vue'
	import { TimePrecise } from '@/dtos/dto/TimePrecise.ts'
	import router from '@/plugins/router.ts'

	const activitySelectionForm = ref<InstanceType<typeof ActivitySelectionForm>>()
	const saveDialog = ref<InstanceType<typeof SaveActivityDialog>>()

	const time = ref(new TimePrecise())
	const paused = ref(false)
	const intervalId = ref<number | undefined>(undefined)
	const startTimestamp = ref(new Date())
	const formDisabled = ref(false)

	const query = router.currentRoute.value.query
	const plannerTaskId = query.plannerTaskId as string | undefined
	const plannerDate = query.plannerDate as string | undefined
	const initialActivityId = query.activityId ? parseInt(query.activityId as string) : null

	const selectedActivityId = ref<number | null>(initialActivityId)

	onMounted(() => {
		if (initialActivityId !== null) {
			selectedActivityId.value = initialActivityId
		}
	})

	// Timestamp-based elapsed time tracking
	const startedAt = ref<number | null>(null)
	const pausedElapsed = ref(0)

	const whatToShow = computed(() => (time.value.hours > 0 ? ['hours', 'minutes', 'seconds'] : ['minutes', 'seconds']))

	function updateTimeDisplay() {
		let totalMs: number
		if (startedAt.value !== null) {
			totalMs = Date.now() - startedAt.value + pausedElapsed.value
		} else {
			totalMs = pausedElapsed.value
		}

		const totalSeconds = Math.floor(totalMs / 1000)

		time.value.hours = Math.floor(totalSeconds / 3600)
		time.value.minutes = Math.floor((totalSeconds % 3600) / 60)
		time.value.seconds = totalSeconds % 60
	}

	async function start() {
		const validationResult = await activitySelectionForm.value?.validate()
		if (validationResult && validationResult.length === 0) {
			formDisabled.value = true
			paused.value = false
			startTimestamp.value = new Date()
			startedAt.value = Date.now()
			intervalId.value = setInterval(updateTimeDisplay, 1000)
		}
	}

	function pause() {
		clearInterval(intervalId.value)
		if (startedAt.value !== null) {
			pausedElapsed.value += Date.now() - startedAt.value
			startedAt.value = null
		}
		paused.value = true
		formDisabled.value = false
	}

	function stop() {
		clearInterval(intervalId.value)
		if (startedAt.value !== null) {
			pausedElapsed.value += Date.now() - startedAt.value
			startedAt.value = null
		}
		updateTimeDisplay()
		showSaveDialog()
	}

	function resetTime() {
		time.value = new TimePrecise()
		paused.value = false
		intervalId.value = undefined
		startedAt.value = null
		pausedElapsed.value = 0
		formDisabled.value = false
	}

	function showSaveDialog() {
		const activityName = activitySelectionForm.value!.getSelectedActivityName
		if (activityName !== null) {
			saveDialog.value!.open(activityName, time.value.toTimeLength)
		}
	}

	function saveActivity(length: Time) {
		if (plannerTaskId && plannerDate) {
			router.push({
				name: 'dayPlanner',
				params: { date: plannerDate },
				query: {
					plannerTaskId,
					actualStartTime: Time.fromDate(startTimestamp.value).getString(),
					actualLength: length.getString(),
				},
			})
		} else {
			activitySelectionForm.value!.saveActivityToHistory(startTimestamp.value, length)
		}
	}
</script>

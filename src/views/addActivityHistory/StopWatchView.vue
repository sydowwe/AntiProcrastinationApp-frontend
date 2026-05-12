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
				:intervalId
				:paused="paused"
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
				:formDisabled
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
	import SaveActivityDialog from '@/components/activity/SaveActivityDialog.vue'
	import { Time } from '@/dtos/dto/Time.ts'
	import { computed, ref } from 'vue'
	import TimerControls from '@/components/addActivityToHistory/TimerControls.vue'
	import { TimePrecise } from '@/dtos/dto/TimePrecise.ts'

	const { activityId = null, compact = false } = defineProps<{
		activityId?: number | null
		compact?: boolean
	}>()

	const emit = defineEmits<{
		started: [actualStartTime: Time]
		done: [startTimestamp: Date, length: Time]
	}>()

	const activitySelectionForm = ref<InstanceType<typeof ActivitySelectionForm>>()
	const saveDialog = ref<InstanceType<typeof SaveActivityDialog>>()

	const time = ref(new TimePrecise())
	const paused = ref(false)
	const intervalId = ref<number | undefined>(undefined)
	const startTimestamp = ref(new Date())
	const formDisabled = ref(false)
	const selectedActivityId = ref<number | null>(activityId)

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
		if (!validationResult || validationResult.length === 0) {
			formDisabled.value = true
			paused.value = false
			startTimestamp.value = new Date()
			startedAt.value = Date.now()
			intervalId.value = setInterval(updateTimeDisplay, 1000)
			emit('started', Time.fromDate(startTimestamp.value))
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
		const name = activitySelectionForm.value?.getSelectedActivityName
		if (!activityId) {
			saveDialog.value!.open(name!, time.value.toTimeLength)
		} else {
			emit('done', startTimestamp.value, time.value.toTimeLength)
		}
	}

	function resetTime() {
		time.value = new TimePrecise()
		paused.value = false
		intervalId.value = undefined
		startedAt.value = null
		pausedElapsed.value = 0
		formDisabled.value = false
	}

	async function saveActivity(length: Time) {
		if (!activityId) {
			await activitySelectionForm.value!.saveActivityToHistory(startTimestamp.value, length)
		}
	}
</script>

<template>
	<LogTimeController
		ref="inner"
		@confirm="handleConfirm"
		@trackingDone="handleTrackingDone"
	/>
</template>

<script setup lang="ts">
	import { ref } from 'vue'
	import LogTimeController from '@/components/dayPlanner/normal/LogTimeController.vue'
	import { API } from '@/plugins/axiosConfig.ts'
	import { useActivityHistoryCrud } from '@/api/activityHistory/activityHistoryApi.ts'
	import { useSnackbar } from '@/composables/general/SnackbarComposable.ts'
	import { ToDoListKind } from '@/dtos/enum/ToDoListKind.ts'
	import type { Time } from '@/dtos/dto/Time.ts'

	const { kind } = defineProps<{ kind: ToDoListKind }>()

	const emit = defineEmits<{
		itemsChanged: [ids: number[]]
		logTimeCreated: [{ historyRecordId: number; itemId: number | undefined; itemWasCompleted: boolean }]
	}>()

	const { create: createActivityHistory } = useActivityHistoryCrud()
	const { showSuccessSnackbar } = useSnackbar()

	const inner = ref<InstanceType<typeof LogTimeController>>()
	const currentItemId = ref<number | null>(null)
	const currentActivityId = ref<number | null>(null)

	const url = kind === ToDoListKind.ROUTINE ? 'routine-todo-list' : 'todo-list-item'

	function open(
		activityId: number,
		activityName: string,
		isManual = false,
		initialStartTime?: Time,
		initialLength?: Time,
		itemId?: number,
	) {
		currentItemId.value = itemId ?? null
		currentActivityId.value = activityId
		inner.value?.open(activityId, activityName, isManual, initialStartTime, initialLength)
	}

	async function finalize(startTimestamp: Date, length: Time) {
		const historyRecordId = await createActivityHistory(startTimestamp, length, currentActivityId.value!)
		showSuccessSnackbar('Time logged')
		const itemId = currentItemId.value ?? undefined
		let itemWasCompleted = false
		if (currentItemId.value !== null) {
			await API.patch(`/${url}/toggle-is-done`, { ids: [currentItemId.value] })
			itemWasCompleted = true
			emit('itemsChanged', [currentItemId.value])
		}
		emit('logTimeCreated', { historyRecordId, itemId, itemWasCompleted })
		currentItemId.value = null
		currentActivityId.value = null
	}

	async function handleConfirm(startTime: Time, length: Time) {
		const startTimestamp = new Date()
		startTimestamp.setHours(startTime.hours, startTime.minutes, 0, 0)
		await finalize(startTimestamp, length)
	}

	async function handleTrackingDone({ startTimestamp, length }: { startTimestamp: Date; length: Time }) {
		await finalize(startTimestamp, length)
	}

	defineExpose({ open })
</script>

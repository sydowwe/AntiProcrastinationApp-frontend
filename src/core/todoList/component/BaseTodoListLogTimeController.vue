<template>
	<LogTimeController
		ref="inner"
		@confirm="handleConfirm"
		@trackingDone="handleTrackingDone"
	/>
</template>

<script setup lang="ts">
	import { ref } from 'vue'
	import LogTimeController from '@/core/dayPlanner/component/normal/LogTimeController.vue'
	import { API } from '@/_common/axiosConfig.ts'
	import {
		useActivityHistoryCrud,
		type HistoryItemLink,
		type TrackedTime,
	} from '@/core/activityHistory/api/activityHistoryApi.ts'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
	import { useI18n } from 'vue-i18n'
	import { ToDoListKind } from '@/core/todoList/dto/enum/ToDoListKind.ts'
	import { Time } from '@/_common/dto/dto/Time.ts'
	import type { ActivityBacklogProfile } from '@/core/leisure/dto/response/ActivityBacklogProfile.ts'

	const { kind } = defineProps<{ kind: ToDoListKind }>()

	const emit = defineEmits<{
		itemsChanged: [ids: number[]]
		logTimeCreated: [{ historyRecordIds: number[]; itemId: number | undefined; itemWasCompleted: boolean }]
	}>()

	const { create: createActivityHistory, createTracked } = useActivityHistoryCrud()
	const { showSuccessSnackbar } = useSnackbar()
	const { t } = useI18n()

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
		autoStart = false,
	) {
		currentItemId.value = itemId ?? null
		currentActivityId.value = activityId
		inner.value?.open(activityId, activityName, isManual, initialStartTime, initialLength, autoStart)
	}

	/**
	 * Starts an earned leisure reward: a running timer, prefilled with the backlog profile's own
	 * length. The completion snackbar's Start and a waiting reward's tap both come through here, so
	 * the two cannot drift apart.
	 *
	 * No item id — the leisure activity is not a to-do item, so logging it must toggle nothing.
	 */
	function openLeisureReward(paired: ActivityBacklogProfile) {
		open(
			paired.activity.id,
			paired.activity.name,
			false,
			undefined,
			paired.durationMinutes > 0 ? Time.fromMinutes(paired.durationMinutes) : undefined,
			undefined,
			true,
		)
	}

	/** After the write: `historyRecordIds` is every row it made — one, or a timer session's several. */
	async function finalize(historyRecordIds: number[]) {
		showSuccessSnackbar(t('toDoList.timeLogged'))
		const itemId = currentItemId.value ?? undefined
		let itemWasCompleted = false
		if (currentItemId.value !== null) {
			// `forceValue: true`, never a bare toggle: the write above may already have ticked the item off on
			// the server (logged time completes an item whose suggested time it reaches — FO2), and a toggle
			// would then un-complete it. Forced, a done item stays done; a counted one steps up by one as before.
			await API.patch(`/${url}/toggle-is-done`, { ids: [currentItemId.value], forceValue: true })
			itemWasCompleted = true
			emit('itemsChanged', [currentItemId.value])
		}
		emit('logTimeCreated', { historyRecordIds, itemId, itemWasCompleted })
		currentItemId.value = null
		currentActivityId.value = null
	}

	async function handleConfirm(startTime: Time, length: Time) {
		const startTimestamp = new Date()
		startTimestamp.setHours(startTime.hours, startTime.minutes, 0, 0)
		await finalize([await createActivityHistory(startTimestamp, length, currentActivityId.value!, itemLink())])
	}

	async function handleTrackingDone(tracked: TrackedTime) {
		await finalize(await createTracked(tracked, currentActivityId.value!, itemLink()))
	}

	/**
	 * The item being logged, as the link the daily recap credits it by. Without it the recap showed every
	 * item at zero however long its timer ran. A leisure reward has no item, so no link.
	 */
	function itemLink(): HistoryItemLink {
		const itemId = currentItemId.value
		if (itemId === null) return {}
		return kind === ToDoListKind.ROUTINE ? { routineTodoListId: itemId } : { todoListItemId: itemId }
	}

	defineExpose({ open, openLeisureReward })
</script>

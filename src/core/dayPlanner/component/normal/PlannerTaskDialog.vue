<template>
	<BasePlannerTaskDialog
		ref="baseDialog"
		:title="
			store.isDuplicating
				? $t('planner.misc.duplicateTaskTitle')
				: !isEdit
					? $t('planner.misc.addNewTaskTitle')
					: $t('planner.misc.editTaskTitle')
		"
		:store
		:createEmptyRequest="createEmptyRequest"
		:hideActivitySelector="!isEdit && pickerMode !== 'all'"
		:suggestedDurationMinutes
		@edit="(id: number, task: PlannerTaskRequest) => emit('edit', id, task)"
		@create="handleCreate"
	>
		<template
			v-if="showDatePicker && !isEdit"
			#before-time
		>
			<MyDateInput
				v-model="selectedDate"
				:dateShowArrows="false"
				class="mx-auto mb-2 pt-2"
				style="min-width: 200px; max-width: 200px"
			/>
		</template>
		<template #before-activity="{ data }">
			<PlannerActivitySourcePicker
				v-if="!isEdit"
				v-model:pickerMode="pickerMode"
				showTodo
				showRoutine
				:initialActivityId="initialPickerActivityId"
				:initialTodoListItemId="initialPickerTodoListItemId"
				@selected="
					(actId: number, todoItemId?: number, suggestedTime?: Time) =>
						onPickerSelected(actId, todoItemId, suggestedTime, data as PlannerTaskRequest)
				"
			/>
		</template>
		<template #additional-fields="{ data }">
			<VSelect
				v-model="data.status"
				:items="statusOptions"
				itemTitle="title"
				itemValue="value"
				:label="$t('planner.misc.statusLabel')"
				class="pt-4"
			/>
		</template>
	</BasePlannerTaskDialog>
</template>

<script setup lang="ts">
	import { computed, nextTick, ref, watch } from 'vue'
	import BasePlannerTaskDialog from '@/core/dayPlanner/component/BasePlannerTaskDialog.vue'
	import PlannerActivitySourcePicker from '@/core/dayPlanner/component/PlannerActivitySourcePicker.vue'
	import MyDateInput from '@/_common/component/dateTime/MyDateInput.vue'
	import { useDayPlannerStore } from '@/core/dayPlanner/store/dayPlannerStore.ts'
	import { PlannerTaskRequest } from '@/core/dayPlanner/dto/request/PlannerTaskRequest.ts'
	import { usePlannerTaskStatusOptions } from '@/core/dayPlanner/dto/enum/PlannerTaskStatus.ts'
	import type { PlannerTaskDialogApi } from '@/core/dayPlanner/component/DayPlannerTypes.ts'
	import { Time } from '@/_common/dto/dto/Time.ts'
	import { useCalendarQuery } from '@/core/activityHistory/api/calendarApi.ts'
	import { formatDateForApi, usStringToUrlString } from '@/_common/utils/DateTimeHelper.ts'
	import { isoDateInUserZone, timeInUserZone } from '@/_common/composable/general/useUserClock.ts'
	import { useDayReplanApi } from '@/core/dayPlanner/api/dayReplanApi.ts'
	import { handoffSearchFloor, isStillPrefilledStart } from '@/core/dayPlanner/utils/handoffFreeSlot.ts'

	const { showDatePicker = false } = defineProps<{
		showDatePicker?: boolean
	}>()

	const emit = defineEmits<{
		(e: 'edit', id: number, task: PlannerTaskRequest): void
		(e: 'create', task: PlannerTaskRequest): void
	}>()

	const { fetchByDate } = useCalendarQuery()
	const store = useDayPlannerStore()
	const baseDialog = ref<PlannerTaskDialogApi>()
	const pickerMode = ref<'all' | 'todo' | 'routine'>('all')
	const selectedDate = ref(new Date())
	const initialPickerActivityId = ref<number | undefined>(undefined)
	// Kept past `createEmptyRequest` consuming the store's copy: the picker loads asynchronously and
	// its selection is what finally writes `todolistId`, so it has to select this exact item.
	const initialPickerTodoListItemId = ref<number | undefined>(undefined)

	const isEdit = computed(() => store.editedId !== undefined)
	const suggestedDurationMinutes = computed(() =>
		store.pendingSuggestedDuration ? Math.max(10, store.pendingSuggestedDuration.getInMinutes) : undefined,
	)

	const statusOptions = usePlannerTaskStatusOptions()

	// FO4 handoff state (see `prefillFromFreeSlot`).
	const { fetchNextFreeSlot } = useDayReplanApi()
	const DEFAULT_HANDOFF_MINUTES = 60
	// The default length the dialog was opened with, from the item's suggested time. Null when the dialog
	// was not opened by a handoff, which is what keeps a block drawn on the grid out of this.
	let handoffMinutes: number | null = null
	// The start the dialog last wrote by itself. While the form still shows it (`isStillPrefilledStart`), the
	// user has not chosen a time, so a date change may ask again; once they have, their time stands.
	let autoStartMinutes: number | null = null

	function createEmptyRequest(suggestedDurationMinutes?: number): PlannerTaskRequest {
		const req = PlannerTaskRequest.createEmpty()
		if (store.pendingInitialTodoListItemId !== undefined) {
			req.todolistId = store.pendingInitialTodoListItemId
			initialPickerTodoListItemId.value = store.pendingInitialTodoListItemId
			store.$patch({ pendingInitialTodoListItemId: undefined })
		}
		if (suggestedDurationMinutes !== undefined) {
			req.endTime = Time.fromMinutes(req.startTime.getInMinutes + suggestedDurationMinutes)
		}
		// The default the free-slot answer may replace (FO4, below), as long as the form still shows it.
		if (handoffMinutes != null) autoStartMinutes = req.startTime.getInMinutes
		return req
	}

	function handleCreate(request: PlannerTaskRequest) {
		if (showDatePicker) {
			// `by-date` takes a DD-MM-YYYY path segment; the raw Date used to be stringified into the
			// URL, so this lookup failed on every create made from outside the planner (e.g. the to-do
			// list) and rejected unobserved.
			fetchByDate(usStringToUrlString(formatDateForApi(selectedDate.value))).catch(() => {
				// A day that has never been planned has no calendar row yet — not an error here.
			})
			request.date = new Date(selectedDate.value)
		}
		emit('create', request)
	}

	function onPickerSelected(
		activityId: number,
		todoListItemId: number | undefined,
		suggestedTime: Time | undefined,
		data: PlannerTaskRequest,
	) {
		baseDialog.value?.prefillActivity(activityId)
		if (todoListItemId != null) {
			data.todolistId = todoListItemId
		}
		if (suggestedTime != null) {
			data.endTime = Time.fromMinutes(data.startTime.getInMinutes + suggestedTime.getInMinutes)
		}
	}

	// ---------------------------------------------------------------- FO4: start where the day is free
	//
	// A block handed over from a to-do or routine item has no time of its own, so the dialog used to
	// start it now, on top of whatever was planned there. The server's `next-free-slot` uses the re-plan's
	// packing rule, so the default lands in free time. It is only a better default: on a failure or a full
	// day the old default stays, silently. Its state is declared above `createEmptyRequest`, which records
	// the default start.

	async function prefillFromFreeSlot(date: string) {
		const minutes = handoffMinutes
		const today = isoDateInUserZone()
		// A past day is a 400, and the route has nothing to say about it anyway.
		if (minutes == null || date < today) return
		// On today the server searches from the exact minute; start it on the time picker's grid instead.
		const options = date === today ? { notBeforeMinute: handoffSearchFloor(timeInUserZone().getInMinutes) } : {}
		try {
			const slot = await fetchNextFreeSlot(date, minutes, options, { _silent: true })
			// Closed, re-dated or edited while the request was out: the answer no longer applies.
			if (handoffMinutes == null || !startIsPrefilled() || date !== currentDialogDate()) return
			if (!slot.found || slot.startTime == null || slot.endTime == null) return
			baseDialog.value?.setTimes(slot.startTime, slot.endTime)
			autoStartMinutes = slot.startTime.getInMinutes
		} catch {
			// a better default only
		}
	}

	function currentDialogDate(): string {
		return showDatePicker ? formatDateForApi(selectedDate.value) : isoDateInUserZone()
	}

	function startIsPrefilled(): boolean {
		return isStillPrefilledStart(baseDialog.value?.currentStartTime()?.getInMinutes ?? null, autoStartMinutes)
	}

	watch(selectedDate, () => {
		if (handoffMinutes == null || !startIsPrefilled()) return
		void prefillFromFreeSlot(currentDialogDate())
	})

	watch(pickerMode, newMode => {
		if (newMode === 'all') {
			baseDialog.value?.resetActivityField()
		}
	})

	watch(
		() => store.dialog,
		async value => {
			if (!value) {
				pickerMode.value = 'all'
				selectedDate.value = new Date()
				initialPickerActivityId.value = undefined
				initialPickerTodoListItemId.value = undefined
				store.$patch({ pendingSuggestedDuration: undefined })
				handoffMinutes = null
				autoStartMinutes = null
				return
			}
			if (store.editedId === undefined && store.pendingInitialActivityId !== undefined) {
				// Set before the base dialog builds its request (after its own `nextTick`), so
				// `createEmptyRequest` records the default start this answer may replace.
				handoffMinutes = suggestedDurationMinutes.value ?? DEFAULT_HANDOFF_MINUTES
				void prefillFromFreeSlot(currentDialogDate())
				const activityId = store.pendingInitialActivityId
				const initialPickerMode = store.pendingPickerMode
				store.$patch({ pendingInitialActivityId: undefined, pendingPickerMode: undefined })
				if (initialPickerMode) {
					pickerMode.value = initialPickerMode
				}
				if (initialPickerMode === 'routine' || initialPickerMode === 'todo') {
					initialPickerActivityId.value = activityId
				} else {
					await nextTick()
					baseDialog.value?.prefillActivity(activityId)
				}
			}
		},
	)
</script>

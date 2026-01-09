<!-- DayPlannerView.vue -->
<template>
<DayPlanner
	:plannerStore="store"
	@redrawTask="redrawTask"
	@delete="del"
>
	<!-- Header with calendar info -->
	<template #header>
		<DayPlannerHeader
			:plannerStore="store"
			:title="currentDateFormatted"
			:calendar
			@openDetails="calendarDetailsDialog = true"
		/>
	</template>

	<!-- Custom event block for normal planner -->
	<template #event-block="{ event, onResizeStart }">
		<EventBlock
			:event="event as PlannerTask"
			@resizeStart="onResizeStart"
		/>
	</template>

	<!-- Toggle Done button for selection action bar -->
	<template #selection-actions="{ store }">
		<VBtn
			v-if="store.selectedEventIds.size > 1"
			size="small"
			variant="tonal"
			color="primaryOutline"
			@click="handleToggleSelectedIsDone"
		>
			Toggle Done
		</VBtn>
	</template>

	<!-- Custom dialog for normal planner -->
	<template #dialog>
		<EventDialog
			@create="create"
			@edit="edit"
		/>
	</template>
</DayPlanner>

<!-- Calendar Details Dialog -->
<CalendarDetailsDialog
	v-model="calendarDetailsDialog"
	:calendar="calendar"
	@updated="updatedCalendar"
/>
</template>

<script setup lang="ts">
import {computed, onMounted, provide, ref, watch} from 'vue'
import DayPlanner from '@/components/dayPlanner/DayPlanner.vue'
import DayPlannerHeader from '@/components/dayPlanner/DayPlannerHeader.vue'
import EventDialog from '@/components/dayPlanner/normal/EventDialog.vue'
import EventBlock from '@/components/dayPlanner/normal/EventBlock.vue'
import CalendarDetailsDialog from '@/components/dayPlanner/CalendarDetailsDialog.vue'
import {useMoment} from '@/scripts/momentHelper.ts'
import {useDayPlannerStore} from '@/stores/dayPlanner/dayPlannerStore.ts'
import {useCalendarQuery, useTaskPlannerCrud} from '@/composables/ConcretesCrudComposable.ts'
import type {PlannerTaskRequest} from '@/dtos/request/activityPlanning/PlannerTaskRequest.ts'
import {useDayPlannerCommon} from '@/composables/dayPlanner/useDayPlannerCommon.ts'
import {useSnackbar} from '@/composables/general/SnackbarComposable.ts';
import router from '@/plugins/router.ts';
import type {PlannerTask} from '@/dtos/response/activityPlanning/PlannerTask.ts';
import {PlannerTaskFilter} from '@/dtos/request/activityPlanning/PlannerTaskFilter.ts';
import type {Calendar} from '@/dtos/response/activityPlanning/Calendar.ts';

const {showErrorSnackbar} = useSnackbar()
const {createWithResponse, update, fetchById, deleteEntity, fetchFiltered} = useTaskPlannerCrud()
const {fetchByDate: fetchCalendarByDate} = useCalendarQuery()
const {formatToDateWithDay, urlStringToUTCDate} = useMoment()
const store = useDayPlannerStore()

// Provide the store for slot content (EventBlock components)
provide('plannerStore', store)
// Use shared composable for all common logic
const {
	setGridPositionFromSpan,
	checkOverlapsBackground,
	checkConflict,
	updateOverlapsBackgroundFlags,
	initializeEventGridPositions,
	redrawTask
} = useDayPlannerCommon(store)

const calendar = ref<Calendar>()
const calendarDetailsDialog = ref(false)

// Lifecycle hooks
onMounted(async () => {
	calendar.value = await fetchCalendarByDate(router.currentRoute.value.params.date as string)
	store.viewedDate = urlStringToUTCDate(router.currentRoute.value.params.date as string)
	store.viewStartTime = calendar.value!.wakeUpTime;
	store.viewEndTime = calendar.value!.bedTime;
	await loadTasks()
})

// View-specific computed properties
const currentDateFormatted = computed(() => {
	return formatToDateWithDay(store.viewedDate)
})

// Load tasks for the current date
async function loadTasks() {
	store.events = await fetchFiltered(new PlannerTaskFilter(calendar.value!.id, store.viewStartTime, store.viewEndTime));
	initializeEventGridPositions()
}

// CRUD operations
async function create(request: PlannerTaskRequest) {
	if (!request.startTime || !request.endTime) {
		return
	}
	if (!request.isBackground) {
		if (checkConflict(request.startTime, request.endTime)) {
			store.conflictSnackbar = true
			return
		}
	}
	request.calendarId = calendar.value?.id;
	const response = await createWithResponse(request)

	if (response.isBackground) {
		updateOverlapsBackgroundFlags(response.startTime, response.endTime)
	} else {
		response.isDuringBackgroundEvent = checkOverlapsBackground(
			response.startTime,
			response.endTime
		)
	}
	setGridPositionFromSpan(response)
	store.events.push(response)
}

async function edit(id: number, request: PlannerTaskRequest) {
	if (!request.startTime || !request.endTime) {
		showErrorSnackbar('Set start time and end time')
		return
	}
	if (!request.isBackground) {
		if (checkConflict(request.startTime, request.endTime, id)) {
			store.conflictSnackbar = true
			return
		}
	}
	const index = store.events.findIndex(e => e.id === id)
	let updatedItem = store.events[index]
	if (!updatedItem)
		return

	await update(id, request)

	if (request.isBackground !== updatedItem.isBackground) {
		updateOverlapsBackgroundFlags(request.startTime, request.endTime)
	}

	updatedItem = await fetchById(id)

	if (!request.isBackground) {
		updatedItem.isDuringBackgroundEvent = checkOverlapsBackground(
			updatedItem.startTime,
			updatedItem.endTime
		)
	}
	setGridPositionFromSpan(updatedItem)

	store.events[index] = updatedItem
}

async function del(): Promise<void> {
	if (store.toDeleteId !== null) {
		await deleteEntity(store.toDeleteId);
		store.events.splice(store.events.findIndex(e => e.id === store.toDeleteId), 1)
	}
	store.deleteDialog = false
	store.toDeleteId = null
}

function handleToggleSelectedIsDone(): void {
	const selectedEventIds = Array.from(store.selectedEventIds)

	selectedEventIds.forEach(eventId => {
		const taskEvent = store.events.find(e => e.id === eventId)
		if (!taskEvent) return

		const newIsDone = !taskEvent.isDone
		taskEvent.isDone = newIsDone

		// We need to emit or call a store method to update
		// For now, we'll assume the store has updateTaskIsDone
		if ('updateTaskIsDone' in store) {
			(store as any).updateTaskIsDone(eventId, newIsDone)
				.catch(() => {
					taskEvent.isDone = !newIsDone
				})
		}
	})
}

async function updatedCalendar(updatedCalendar: Calendar): Promise<void> {
	calendar.value = updatedCalendar;
	store.viewStartTime = updatedCalendar.wakeUpTime
	store.viewEndTime = updatedCalendar.bedTime
}

// Watch for time range changes
watch([() => store.viewStartTime, () => store.viewEndTime], () => {
	initializeEventGridPositions()
}, {deep: true})

// Watch for date changes to reload tasks
watch(() => store.viewedDate, () => {
	loadTasks()
}, {deep: true})
</script>

<style scoped>
/* View-specific styles if needed */
</style>
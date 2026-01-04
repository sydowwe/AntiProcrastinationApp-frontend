<!-- DayPlanner.vue - Unified day planner component for both regular and template views -->
<template>
<VCard class="w-100 d-flex flex-column">
	<!-- Header slot - each view provides its own header -->
	<slot name="header" :store="plannerStore">
		<VCardTitle class="d-flex justify-space-between align-center flex-wrap ga-2">
			<span>{{ title }}</span>

			<TimeRangePicker
				v-model:start="plannerStore.viewStartTime"
				v-model:end="plannerStore.viewEndTime"
			/>
			<div class="d-flex ga-2 align-center flex-wrap">
				<!-- Edit button - only for single focused event -->
				<VBtn
					color="secondary"
					@pointerdown.prevent="plannerStore.openEditDialog"
					:class="{ 'is-hidden': !plannerStore.focusedEventId || plannerStore.hasSelectedEvents }"
				>
					Edit
				</VBtn>

				<!-- Toggle isDone - for selected events -->
				<VBtn
					v-if="plannerStore.hasSelectedEvents"
					color="success"
					variant="outlined"
					@click="handleToggleSelectedIsDone"
					prependIcon="check"
				>
					Toggle Done ({{ plannerStore.selectedEventIds.value.size }})
				</VBtn>

				<!-- Delete button - for focused or selected events -->
				<VBtn
					color="secondaryOutline"
					variant="outlined"
					@pointerdown.prevent="handleDeleteClick"
					:class="{ 'is-hidden': !plannerStore.focusedEventId && !plannerStore.hasSelectedEvents }"
				>
					Delete{{ plannerStore.hasSelectedEvents ? ` (${plannerStore.selectedEventIds.value.size})` : '' }}
				</VBtn>

				<VBtn
					color="primary"
					@click="plannerStore.openCreateDialogEmpty"
					prependIcon="plus"
				>
					{{ addButtonText }}
				</VBtn>
			</div>
		</VCardTitle>
	</slot>

	<VCardText class="flex-fill d-flex flex-column ga-4">
		<div class="calendar-grid flex-fill">

			<!-- Time Column -->
			<PlannerTimeColumn :store="plannerStore"/>

			<!-- Events Column with event block slot -->
			<PlannerTasksColumn
				:store="plannerStore"
				@redrawTask="emit('redrawTask', $event.eventId, $event.updates as Partial<TTask>)"
			>
				<template #event-block="{ event, onResizeStart }">
					<!-- Default slot for event blocks - each view provides its own EventBlock component -->
					<slot name="event-block" :event="event" :onResizeStart="onResizeStart">

					</slot>
				</template>
			</PlannerTasksColumn>
		</div>

		<!-- Legend slot - optional for future use -->
		<slot name="legend">
			<div class="calendar-legend">
				<!-- Add category legend here if needed -->
			</div>
		</slot>
	</VCardText>
</VCard>

<!-- Delete Confirmation Dialog -->
<MyDialog
	title="Delete confirmation"
	:text="deleteConfirmationText"
	v-model="plannerStore.deleteDialog"
	@confirmed="emit('delete')"
	confirmBtnColor="error"
/>

<!-- Dialog slot - each view provides its own dialog (EventDialog vs PlannerTaskTemplateDialog) -->
<slot name="dialog" :store="plannerStore"/>

<!-- Conflict Snackbar -->
<VSnackbar
	v-model="plannerStore.conflictSnackbar"
	color="error"
	:timeout="3000"
>
	{{ conflictMessage }}
	<template v-slot:actions>
		<VBtn
			variant="text"
			@click="plannerStore.conflictSnackbar = false"
		>
			Close
		</VBtn>
	</template>
</VSnackbar>
</template>

<script setup lang="ts"
        generic="TTask extends IBasePlannerTask<TTaskRequest>, TTaskRequest extends IBasePlannerTaskRequest, TStore extends IBaseDayPlannerStore<TTask, TTaskRequest>">
import {computed} from 'vue'
import MyDialog from '@/components/dialogs/MyDialog.vue'
import PlannerTimeColumn from '@/components/dayPlanner/PlannerTimeColumn.vue'
import PlannerTasksColumn from '@/components/dayPlanner/PlannerTasksColumn.vue'
import TimeRangePicker from '@/components/general/dateTime/TimeRangePicker.vue'
import type {IBaseDayPlannerStore} from '@/types/IBaseDayPlannerStore.ts';
import type {IBasePlannerTask} from '@/dtos/response/activityPlanning/IBasePlannerTask.ts';
import type {IBasePlannerTaskRequest} from '@/dtos/request/activityPlanning/IBasePlannerTaskRequest.ts';

const props = defineProps<{
	plannerStore: TStore
	title: string
	addButtonText?: string
	conflictMessage?: string
}>()


const deleteConfirmationText = computed(() => {
	if (props.plannerStore.hasSelectedEvents) {
		const count = props.plannerStore.selectedEventIds.size
		return `Are you sure you want to delete ${count} selected event${count > 1 ? 's' : ''}?`
	}
	const eventName = props.plannerStore.toDeleteEvent?.activity?.name ?? 'this event'
	return `Are you sure you want to delete ${eventName}?`
})

function handleDeleteClick(): void {
	if (props.plannerStore.hasSelectedEvents) {
		props.plannerStore.openDeleteDialogForSelected()
	} else {
		props.plannerStore.openDeleteDialog()
	}
}

function handleToggleSelectedIsDone(): void {
	const selectedEventIds = Array.from(props.plannerStore.selectedEventIds)

	selectedEventIds.forEach(eventId => {
		const taskEvent = props.plannerStore.events.find(e => e.id === eventId)
		if (!taskEvent) return

		const newIsDone = !taskEvent.isDone
		taskEvent.isDone = newIsDone

		// We need to emit or call a store method to update
		// For now, we'll assume the store has updateTaskIsDone
		if ('updateTaskIsDone' in props.plannerStore) {
			(props.plannerStore as any).updateTaskIsDone(eventId, newIsDone)
				.catch(() => {
					taskEvent.isDone = !newIsDone
				})
		}
	})
}

const emit = defineEmits<{
	redrawTask: [eventId: number, updates: Partial<IBasePlannerTask<IBasePlannerTaskRequest>>],
	delete: []
}>()
</script>

<style scoped>
.calendar-grid {
	background: rgb(var(--v-theme-neutral-100));
	display: grid;
	grid-template-columns: 80px 1fr;
	gap: 0;
	height: 600px;
	overflow-y: auto;
	border: 2px solid #444;
	padding: 10px 0;
}

.calendar-legend {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	padding: 8px;
	background: #f5f5f5;
	border-radius: 4px;
}

/* Scrollbar styling */
.calendar-grid::-webkit-scrollbar {
	width: 8px;
	height: 8px;
}

.calendar-grid::-webkit-scrollbar-track {
	background: #f1f1f1;
}

.calendar-grid::-webkit-scrollbar-thumb {
	background: #888;
	border-radius: 4px;
}

.calendar-grid::-webkit-scrollbar-thumb:hover {
	background: #555;
}

/* Responsive adjustments */
@media (max-width: 600px) {
	.calendar-grid {
		height: 500px;
	}
}
</style>

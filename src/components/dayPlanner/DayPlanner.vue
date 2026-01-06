<!-- DayPlanner.vue - Unified day planner component for both regular and template views -->
<template>
<VCard class="w-100 h-100 d-flex flex-column">
	<!-- Header slot - each view provides its own header -->
	<slot name="header" :store="plannerStore">
		<VCardTitle class="px-5 pb-0 pt-3 pt-md-4 d-flex justify-space-between align-center flex-wrap ga-2">
			<div class="d-flex align-center ga-3">
				<span class="text-h5">{{ title }}</span>

				<slot name="headerPrepend"></slot>
			</div>

			<TimeRangePicker
				v-model:start="plannerStore.viewStartTime"
				v-model:end="plannerStore.viewEndTime"
			/>

			<div class="d-flex ga-2 align-center flex-wrap">
				<slot name="headerAppend"></slot>

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

	<VCardText class="pa-3 pa-md-4 flex-fill d-flex flex-column ga-4">
		<div class="calendar-grid flex-fill">

			<!-- Time Column -->
			<PlannerTimeColumn/>

			<!-- Events Column with event block slot -->
			<PlannerTasksColumn
				@redrawTask="emit('redrawTask', $event.eventId, $event.updates as Partial<TTask>)"
			>
				<template #event-block="{ event, onResizeStart }">
					<!-- Default slot for event blocks - each view provides its own EventBlock component -->
					<slot name="event-block" :event="event" :onResizeStart="onResizeStart">

					</slot>
				</template>
			</PlannerTasksColumn>

			<!-- Floating Selection Action Bar -->
			<SelectionActionBar>
				<slot name="selection-actions" :store="plannerStore"></slot>
			</SelectionActionBar>
		</div>

		<!-- Legend slot - optional for future use -->
		<!--		<slot name="legend">-->
		<!--			<div class="calendar-legend">-->
		<!--			</div>-->
		<!--		</slot>-->
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
import {computed, provide} from 'vue'
import MyDialog from '@/components/dialogs/MyDialog.vue'
import PlannerTimeColumn from '@/components/dayPlanner/PlannerTimeColumn.vue'
import PlannerTasksColumn from '@/components/dayPlanner/PlannerTasksColumn.vue'
import SelectionActionBar from '@/components/dayPlanner/SelectionActionBar.vue'
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

// Provide the store to all descendant components
provide('plannerStore', props.plannerStore)


const deleteConfirmationText = computed(() => {
	if (props.plannerStore.hasSelectedEvents) {
		const count = props.plannerStore.selectedEventIds.size
		return `Are you sure you want to delete ${count} selected event${count > 1 ? 's' : ''}?`
	}
	const eventName = props.plannerStore.toDeleteEvent?.activity?.name ?? 'this event'
	return `Are you sure you want to delete ${eventName}?`
})

const emit = defineEmits<{
	redrawTask: [eventId: number, updates: Partial<IBasePlannerTask<IBasePlannerTaskRequest>>],
	delete: []
}>()
</script>

<style scoped>
.calendar-grid {
	background: rgb(var(--v-theme-neutral-50));
	display: grid;
	grid-template-columns: 80px 1fr;
	gap: 0;
	height: 600px;
	overflow-y: auto;
	border: 2px solid #444;
	padding: 10px 0 0 0;
	position: relative;
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
	background: rgb(var(--v-theme-neutral-50));
}

.calendar-grid::-webkit-scrollbar-thumb {
	background: #888;
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

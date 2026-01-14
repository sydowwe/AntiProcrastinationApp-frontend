<!-- DayPlanner.vue - Unified day planner component for both regular and template views -->
<template>
<VCard class="w-100 h-100 d-flex flex-column">
	<!-- Header slot - each view provides its own header -->
	<slot name="header" :store="plannerStore">
		<!-- Default header for template views -->
		<VCardTitle class="px-5 pb-2 pt-3 pt-md-4 d-flex justify-space-between align-center flex-wrap ga-2">
			<div class="d-flex align-center ga-3">
				<span class="text-h5">{{ title }}</span>
				<slot name="headerPrepend"></slot>
			</div>

			<TimeRangePicker
				startIcon="sun"
				endIcon="moon"
				v-model:start="plannerStore.viewStartTime"
				v-model:end="plannerStore.viewEndTime"
			/>

			<div class="d-flex ga-2 align-center flex-wrap">
				<VBtn
					color="primary"
					@click="plannerStore.openCreateDialogEmpty"
					prependIcon="plus"
				>
					Add New Task
				</VBtn>
			</div>
		</VCardTitle>
	</slot>

	<VCardText class="pa-3 pa-md-4 flex-fill d-flex flex-column ga-4">
		<div class="calendar-grid flex-fill">

			<!-- Time Column -->
			<PlannerTimeColumn/>

			<!-- Tasks Column with task block slot -->
			<PlannerTasksColumn>
				<template #task-block="{ task, onResizeStart }">
					<!-- Default slot for task blocks - each view provides its own TaskBlock component -->
					<slot name="task-block" :task="task" :onResizeStart="onResizeStart">

					</slot>
				</template>
			</PlannerTasksColumn>

			<slot name="action-bar"></slot>
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

<!-- Dialog slot - each view provides its own dialog (TaskDialog vs PlannerTaskTemplateDialog) -->
<slot name="dialog" :store="plannerStore"/>

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
	title?: string
}>()

// Provide the store to all descendant components
provide('plannerStore', props.plannerStore)


const deleteConfirmationText = computed(() => {
	const tasks = props.plannerStore.tasks.filter(e => props.plannerStore.selectedTaskIds.has(e.id))
	if (props.plannerStore.selectedTaskIds.size > 1) {
		const count = props.plannerStore.selectedTaskIds.size
		return `Are you sure you want to delete ${count} selected tasks?`
	}
	const taskName = tasks[0]?.activity?.name ?? 'this task'
	return `Are you sure you want to delete ${taskName}?`
})

const emit = defineEmits<{
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

<!-- DayPlanner.vue - Unified day planner component for both regular and template views -->
<template>
	<div>
		<VCard class="w-100 h-100 d-flex flex-column">
			<!-- Header slot - each view provides its own header -->
			<slot name="header" />

			<VCardText class="pa-3 pa-md-4 pt-2 pt-md-3 flex-fill d-flex flex-column ga-4">
				<div class="calendar-grid flex-fill">
					<!-- Time Column -->
					<PlannerTimeColumn />

					<!-- Tasks Column with task block slot -->
					<PlannerTasksColumn>
						<template #task-block="{ task, onResizeStart }">
							<!-- Default slot for task blocks - each view provides its own TaskBlock component -->
							<slot
								name="task-block"
								:task="task"
								:onResizeStart="onResizeStart"
							></slot>
						</template>
					</PlannerTasksColumn>
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
			v-model="deleteDialogVisible"
			title="Delete confirmation"
			:text="deleteConfirmationText"
			confirmBtnColor="error"
			@confirmed="emit('delete')"
		/>
		<ActionBar
			:isShown="!!store.placingItem"
			@cancel="store.placingItem = null"
		>
			<span class="text-body-2 text-medium-emphasis">Placing</span>
			<span class="text-body-2 text-high-emphasis">{{ store.placingItem?.name }}</span>
		</ActionBar>
		<slot name="action-bar"></slot>
		<!-- Floating Selection Action Bar -->
		<SelectionActionBar>
			<slot name="selection-actions"></slot>
		</SelectionActionBar>
		<!-- Dialog slot - each view provides its own dialog (TaskDialog vs PlannerTaskTemplateDialog) -->
		<slot name="dialog" />
	</div>
</template>

<script
	setup
	lang="ts"
	generic="
		TTask extends IBasePlannerTask<TTaskRequest>,
		TTaskRequest extends IBasePlannerTaskRequest,
		TStore extends IBaseDayPlannerStore<TTask, TTaskRequest>
	"
>
	import { computed, inject, watch } from 'vue'
	import MyDialog from '@/components/general/dialogs/MyDialog.vue'
	import PlannerTimeColumn from '@/components/dayPlanner/misc/PlannerTimeColumn.vue'
	import PlannerTasksColumn from '@/components/dayPlanner/PlannerTasksColumn.vue'
	import SelectionActionBar from '@/components/dayPlanner/misc/SelectionActionBar.vue'
	import type { IBaseDayPlannerStore } from '@/stores/dayPlanner/IBaseDayPlannerStore.ts'
	import type { IBasePlannerTask } from '@/dtos/response/activityPlanning/IBasePlannerTask.ts'
	import type { IBasePlannerTaskRequest } from '@/dtos/request/activityPlanning/IBasePlannerTaskRequest.ts'
	import ActionBar from '@/components/general/ActionBar.vue'
	import { useUserStore } from '@/stores/userStore.ts'

	const emit = defineEmits<{
		delete: []
	}>()

	const store = inject<TStore>('plannerStore')!
	const userStore = useUserStore()

	const deleteDialogVisible = computed({
		get: () => store.deleteDialog,
		set: value => store.$patch({ deleteDialog: value }),
	})

	watch(deleteDialogVisible, val => {
		if (val && !userStore.currentUser.askBeforeDelete) {
			deleteDialogVisible.value = false
			emit('delete')
		}
	})

	const deleteConfirmationText = computed(() => {
		const tasks = store.tasks.filter(e => store.selectedTaskIds.has(e.id))
		if (store.selectedTaskIds.size > 1) {
			const count = store.selectedTaskIds.size
			return `Are you sure you want to delete ${count} selected tasks?`
		}
		const taskName = tasks[0]?.activity?.name ?? 'this task'
		return `Are you sure you want to delete ${taskName}?`
	})
</script>

<style scoped>
	.calendar-grid {
		background: rgb(var(--v-theme-surface));
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
		background: rgb(var(--v-theme-surface));
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

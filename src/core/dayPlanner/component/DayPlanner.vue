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
					<PlannerTasksColumn :helpExtra="gridHelpExtra">
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
			:title="$t('general.deleteConfirmationTitle')"
			:text="deleteConfirmationText"
			confirmBtnColor="error"
			@confirmed="emit('delete')"
		/>
		<ActionBar
			:isShown="!!store.placingItem"
			@cancel="store.placingItem = null"
		>
			<span class="text-body-2 text-medium-emphasis">{{ $t('planner.misc.placing') }}</span>
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

<script setup lang="ts">
	import { computed, inject, provide, ref, watch } from 'vue'
	import MyDialog from '@/_common/component/dialog/MyDialog.vue'
	import PlannerTimeColumn from '@/core/dayPlanner/component/misc/PlannerTimeColumn.vue'
	import PlannerTasksColumn from '@/core/dayPlanner/component/PlannerTasksColumn.vue'
	import SelectionActionBar from '@/core/dayPlanner/component/misc/SelectionActionBar.vue'
	import { PLANNER_STORE_KEY } from '@/core/dayPlanner/store/IBaseDayPlannerStore.ts'
	import { PLANNER_GRID_KEY } from '@/core/dayPlanner/component/DayPlannerTypes.ts'
	import ActionBar from '@/_common/component/ActionBar.vue'
	import { useDeleteConfirmation } from '@/core/user/composable/useDeleteConfirmation.ts'
	import { useI18n } from 'vue-i18n'

	const { gridHelpExtra } = defineProps<{
		/** Appended to the grid's screen-reader keyboard help, for keys only this planner binds. */
		gridHelpExtra?: string
	}>()

	const emit = defineEmits<{
		delete: []
	}>()

	const store = inject(PLANNER_STORE_KEY)!

	// Filled in by `PlannerTasksColumn`; read by `SelectionActionBar`, which is its sibling and has
	// no other way to hand focus back to the grid. One per planner, so the split view stays honest.
	const gridElement = ref<HTMLElement | undefined>(undefined)
	provide(PLANNER_GRID_KEY, gridElement)
	const { shouldConfirm } = useDeleteConfirmation()
	const { t } = useI18n()

	// Written straight onto the store rather than through `$patch`: these are setup stores, so the
	// field is a plain writable ref, and `$patch` on the injected contract could not be typed at all.
	const deleteDialogVisible = computed({
		get: () => store.deleteDialog,
		set: value => (store.deleteDialog = value),
	})

	// Inverted against the other four call sites because the store opens this dialog, not a handler:
	// the only thing left to do here is close it again when the user has opted out of confirming.
	//
	// This is the one delete of the five that is genuinely a leaf AND undoable — `usePlannerCrud`
	// pushes a "Task deleted" entry that recreates the tasks — so skipping the dialog still leaves
	// the user a way back. That is why it is the site the preference should have most say over.
	watch(deleteDialogVisible, val => {
		if (val && !shouldConfirm({ cascades: false, undoable: true })) {
			deleteDialogVisible.value = false
			emit('delete')
		}
	})

	const deleteConfirmationText = computed(() => {
		const tasks = store.tasks.filter(e => store.selectedTaskIds.has(e.id))
		if (store.selectedTaskIds.size > 1) {
			const count = store.selectedTaskIds.size
			return t('planner.misc.deleteConfirmMultiple', { count })
		}
		const taskName = tasks[0]?.activity?.name ?? t('planner.misc.taskFallbackName')
		return t('planner.misc.deleteConfirmSingle', { name: taskName })
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

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

					<slot name="action-bar"></slot>
					<!-- Floating Selection Action Bar -->
					<SelectionActionBar>
						<slot name="selection-actions"></slot>
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
			v-model="deleteDialogVisible"
			title="Delete confirmation"
			:text="deleteConfirmationText"
			confirmBtnColor="error"
			@confirmed="emit('delete')"
		/>

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
	import { computed, inject, onMounted, onUnmounted } from 'vue'
	import MyDialog from '@/components/dialogs/MyDialog.vue'
	import PlannerTimeColumn from '@/components/dayPlanner/misc/PlannerTimeColumn.vue'
	import PlannerTasksColumn from '@/components/dayPlanner/PlannerTasksColumn.vue'
	import SelectionActionBar from '@/components/dayPlanner/misc/SelectionActionBar.vue'
	import type { IBaseDayPlannerStore } from '@/stores/dayPlanner/IBaseDayPlannerStore.ts'
	import { type IBasePlannerTask, TaskSpan } from '@/dtos/response/activityPlanning/IBasePlannerTask.ts'
	import type { IBasePlannerTaskRequest } from '@/dtos/request/activityPlanning/IBasePlannerTaskRequest.ts'
	import { useUndoStack } from '@/composables/general/useUndoStack.ts'
	import { CreationPreviewType } from '@/components/dayPlanner/DayPlannerTypes.ts'
	import { isSameDay } from '@/utils/DateTimeHelper.ts'
	import { Time } from '@/dtos/dto/Time.ts'

	const emit = defineEmits<{
		delete: []
	}>()

	const store = inject<TStore>('plannerStore')!

	const deleteDialogVisible = computed({
		get: () => store.deleteDialog,
		set: value => store.$patch({ deleteDialog: value }),
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

	const { undo, clear, push } = useUndoStack()

	async function handleArrowMove(direction: 'up' | 'down') {
		const selectedIds = store.selectedTaskIds
		if (selectedIds.size === 0) return

		const rowDelta = direction === 'up' ? -1 : 1
		const tasks = store.tasks.filter(t => selectedIds.has(t.id) && !t.isBackground)
		if (tasks.length === 0) return

		// Pre-compute new grid rows and check validity for all tasks first
		const moves = tasks.map(task => ({
			task,
			newStartRow: task.gridRowStart + rowDelta,
			newEndRow: task.gridRowEnd + rowDelta,
		}))

		for (const { newStartRow, newEndRow, task } of moves) {
			if (newStartRow < 1 || newEndRow > store.totalGridRows + 1) return
			const hasConflict = store.tasks.some(other => {
				if (selectedIds.has(other.id) || other.isBackground || other.id === task.id) return false
				return !(newEndRow <= other.gridRowStart || newStartRow >= other.gridRowEnd)
			})
			if (hasConflict) return
		}

		// Capture originals for undo
		const originals = tasks.map(t => ({ ...t }) as TTask)

		// Apply moves locally
		for (const { task, newStartRow, newEndRow } of moves) {
			store.redrawTask(task.id, {
				startTime: store.slotIndexToTime(newStartRow - 1),
				endTime: store.slotIndexToTime(newEndRow - 1),
				gridRowStart: newStartRow,
				gridRowEnd: newEndRow,
			} as Partial<TTask>)
		}

		// Persist and push undo
		const undoDate = store.viewedDate ? new Date(store.viewedDate) : undefined
		await Promise.all(
			moves.map(({ task }) => {
				const updated = store.tasks.find(t => t.id === task.id)!
				return store.updateTaskSpan(task.id, TaskSpan.fromTask(updated))
			}),
		)
			.then(() => {
				push({
					description: tasks.length > 1 ? 'Tasks moved' : 'Task moved',
					date: undoDate,
					undo: async () => {
						for (const orig of originals) {
							store.redrawTask(orig.id, orig)
							await store.updateTaskSpan(orig.id, TaskSpan.fromTask(orig))
						}
					},
				})
			})
			.catch(() => {
				for (const orig of originals) {
					store.redrawTask(orig.id, orig)
				}
			})
	}

	function handleKeyDown(e: KeyboardEvent) {
		const target = e.target as HTMLElement
		if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return
		if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
			e.preventDefault()
			undo()
			return
		}
		if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && store.selectedTaskIds.size > 0) {
			e.preventDefault()
			handleArrowMove(e.key === 'ArrowUp' ? 'up' : 'down')
			return
		}
		if (
			(e.key === 'n' || e.key === 'N') &&
			store.canCreate &&
			store.viewedDate &&
			isSameDay(store.viewedDate, new Date())
		) {
			const slotIndex = store.timeToSlotIndex(Time.fromDate(new Date()))
			const durationSlots = Math.floor(60 / store.timeSlotDuration)
			store.creationPreview = new CreationPreviewType(slotIndex + 1, slotIndex + 1, slotIndex + durationSlots)
			store.openCreateDialog()
		}
	}

	onMounted(() => document.addEventListener('keydown', handleKeyDown))
	onUnmounted(() => {
		document.removeEventListener('keydown', handleKeyDown)
		clear()
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

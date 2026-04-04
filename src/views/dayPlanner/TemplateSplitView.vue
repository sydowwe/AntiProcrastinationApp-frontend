<!-- TemplateSplitView.vue - Side-by-side template editor with cross-template task drag -->
<template>
	<div class="py-4 w-100">
		<div class="mb-4 d-flex align-center ga-2">
			<VBtn
				icon="arrow-left"
				variant="tonal"
				color="secondaryOutline"
				size="small"
				@click="router.push({ name: 'dayPlannerTemplateList' })"
			/>
			<span class="text-h5">Compare & Edit Templates</span>
		</div>

		<div class="split-view-grid">
			<!-- Left panel -->
			<div
				ref="leftPanelRef"
				class="split-panel"
				:class="{ 'drop-target-active': isDropTargetLeft }"
			>
				<VIdSelect
					v-model="leftTemplateId"
					:items="templateOptions"
					label="Left Template"
					class="mb-2"
					hideDetails
				/>
				<TemplatePlannerPanel
					v-if="leftTemplateId !== null"
					storeId="main"
					:templateId="leftTemplateId"
					isSplitView
				/>
				<div
					v-else
					class="empty-panel d-flex align-center justify-center"
				>
					<span class="text-medium-emphasis">Select a template</span>
				</div>
			</div>

			<VDivider vertical />

			<!-- Right panel -->
			<div
				ref="rightPanelRef"
				class="split-panel"
				:class="{ 'drop-target-active': isDropTargetRight }"
			>
				<VIdSelect
					v-model="rightTemplateId"
					:items="templateOptions"
					label="Right Template"
					class="mb-2"
					hideDetails
				/>
				<TemplatePlannerPanel
					v-if="rightTemplateId !== null"
					storeId="secondary"
					:templateId="rightTemplateId"
					isSplitView
				/>
				<div
					v-else
					class="empty-panel d-flex align-center justify-center"
				>
					<span class="text-medium-emphasis">Select a template</span>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { onBeforeUnmount, onMounted, ref } from 'vue'
	import { useRouter } from 'vue-router'
	import { dropTargetForElements, monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
	import TemplatePlannerPanel from '@/components/dayPlanner/template/TemplatePlannerPanel.vue'
	import { useTaskPlannerDayTemplateTaskCrud } from '@/api/taskPlanner/taskPlannerDayTemplateApi.ts'
	import { useTemplatePlannerTaskCrud } from '@/api/taskPlanner/templatePlannerTaskApi.ts'
	import {
		useSecondaryTemplateDayPlannerStore,
		useTemplateDayPlannerStore,
	} from '@/stores/dayPlanner/templateDayPlannerStore.ts'
	import { TemplatePlannerTaskRequest } from '@/dtos/request/activityPlanning/template/TemplatePlannerTaskRequest.ts'
	import { useSnackbar } from '@/composables/general/SnackbarComposable.ts'

	const router = useRouter()
	const { fetchAll } = useTaskPlannerDayTemplateTaskCrud()
	const { update: updateTask, fetchById: fetchByIdTask } = useTemplatePlannerTaskCrud()
	const { showSuccessSnackbar, showErrorSnackbar } = useSnackbar()

	const mainStore = useTemplateDayPlannerStore()
	const secondaryStore = useSecondaryTemplateDayPlannerStore()

	const templateOptions = ref<{ id: number; text: string }[]>([])
	const leftTemplateId = ref<number | null>(null)
	const rightTemplateId = ref<number | null>(null)

	const leftPanelRef = ref<HTMLElement | null>(null)
	const rightPanelRef = ref<HTMLElement | null>(null)
	const isDropTargetLeft = ref(false)
	const isDropTargetRight = ref(false)

	const dropCleanups: (() => void)[] = []
	let monitorCleanup: (() => void) | null = null

	onMounted(async () => {
		const templates = await fetchAll()
		templateOptions.value = templates.map(t => ({ id: t.id, text: t.name }))

		setupDropTargets()

		monitorCleanup = monitorForElements({
			canMonitor: ({ source }) => source.data.type === 'cross-template-task',
			onDrop: ({ source, location }) => {
				isDropTargetLeft.value = false
				isDropTargetRight.value = false

				const panelTarget = location.current.dropTargets.find(t => t.data.panel !== undefined)
				if (!panelTarget) return

				const sourceStoreId = source.data.sourceStoreId as string
				const targetStoreId = panelTarget.data.targetStoreId as string
				if (sourceStoreId === targetStoreId) return

				const targetTemplateId = panelTarget.data.targetTemplateId as number | null
				if (!targetTemplateId) return

				moveTask(source.data.taskId as number, sourceStoreId, targetStoreId, targetTemplateId)
			},
		})
	})

	function setupDropTargets() {
		if (leftPanelRef.value) {
			dropCleanups.push(
				dropTargetForElements({
					element: leftPanelRef.value,
					canDrop: ({ source }) =>
						source.data.type === 'cross-template-task' && source.data.sourceStoreId !== 'main',
					getData: () => ({ panel: 'left', targetStoreId: 'main', targetTemplateId: leftTemplateId.value }),
					onDragEnter: () => {
						isDropTargetLeft.value = true
					},
					onDragLeave: () => {
						isDropTargetLeft.value = false
					},
				}),
			)
		}
		if (rightPanelRef.value) {
			dropCleanups.push(
				dropTargetForElements({
					element: rightPanelRef.value,
					canDrop: ({ source }) =>
						source.data.type === 'cross-template-task' && source.data.sourceStoreId !== 'secondary',
					getData: () => ({
						panel: 'right',
						targetStoreId: 'secondary',
						targetTemplateId: rightTemplateId.value,
					}),
					onDragEnter: () => {
						isDropTargetRight.value = true
					},
					onDragLeave: () => {
						isDropTargetRight.value = false
					},
				}),
			)
		}
	}

	onBeforeUnmount(() => {
		monitorCleanup?.()
		dropCleanups.forEach(c => c())
	})

	async function moveTask(taskId: number, sourceStoreId: string, targetStoreId: string, targetTemplateId: number) {
		const sourceStore = sourceStoreId === 'main' ? mainStore : secondaryStore
		const targetStore = targetStoreId === 'main' ? mainStore : secondaryStore

		const task = sourceStore.tasks.find(t => t.id === taskId)
		if (!task) return

		const request = TemplatePlannerTaskRequest.fromEntity(task)
		request.templateId = targetTemplateId

		try {
			await updateTask(taskId, request)
			sourceStore.tasks = sourceStore.tasks.filter(t => t.id !== taskId)
			const movedTask = await fetchByIdTask(taskId)
			targetStore.setGridPositionFromSpan(movedTask)
			targetStore.tasks.push(movedTask)
			showSuccessSnackbar('Task moved to other template')
		} catch {
			showErrorSnackbar('Failed to move task')
		}
	}
</script>

<style scoped>
	.split-view-grid {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		gap: 16px;
		height: calc(100vh - 140px);
	}

	.split-panel {
		min-width: 0;
		overflow: hidden;
		transition: outline 0.15s;
		border-radius: 8px;
	}

	.split-panel.drop-target-active {
		outline: 2px solid rgb(var(--v-theme-primary));
	}

	.empty-panel {
		height: 400px;
		border: 2px dashed rgb(var(--v-theme-neutral-300));
		border-radius: 8px;
	}
</style>

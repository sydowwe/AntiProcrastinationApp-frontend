<!-- TemplateDayPlannerView.vue -->
<template>
	<div class="py-4 d-flex flex-column flex-md-row ga-4 w-100 h-100">
		<TemplatePlannerPanel
			v-model="detailsHidden"
			:templateId="templateId"
		/>

		<DayPlanner
			class="flex-fill"
			:plannerStore="store"
			@delete="crud.del"
		>
			<template #header>
				<TemplatePlannerHeader :title="store.templateName || 'Day Template'">
					<template #headerPrepend>
						<VBtn
							v-if="detailsHidden"
							color="secondaryOutline"
							prependIcon="eye"
							variant="outlined"
							@click="detailsHidden = !detailsHidden"
						>
							Edit details
						</VBtn>
						<span
							v-if="taskStats.taskCount > 0"
							class="text-caption text-medium-emphasis"
						>
							{{ taskStats.taskCount }} tasks ·
							{{ timeNiceFromMinutes(taskStats.plannedMinutes) }} planned ·
							<span :class="taskStats.freeMinutes > 0 ? 'text-success' : 'text-warning'">
								{{ timeNiceFromMinutes(taskStats.freeMinutes) }} free
							</span>
						</span>
					</template>
				</TemplatePlannerHeader>
			</template>

			<template #task-block="{ task, onResizeStart }">
				<TemplatePlannerTaskBlock
					:task="task as TemplatePlannerTask"
					@resizeStart="onResizeStart"
				/>
			</template>

			<template #dialog>
				<TemplatePlannerTaskDialog
					@create="crud.create"
					@edit="crud.edit"
				/>
			</template>
		</DayPlanner>
	</div>
</template>

<script setup lang="ts">
	import { computed, onMounted, onUnmounted, provide, ref, watch } from 'vue'
	import DayPlanner from '@/components/dayPlanner/DayPlanner.vue'
	import TemplatePlannerHeader from '@/components/dayPlanner/template/TemplatePlannerHeader.vue'
	import TemplatePlannerTaskDialog from '@/components/dayPlanner/template/TemplatePlannerTaskDialog.vue'
	import TemplatePlannerTaskBlock from '@/components/dayPlanner/template/TemplatePlannerTaskBlock.vue'
	import {
		useSecondaryTemplateDayPlannerStore,
		useTemplateDayPlannerStore,
	} from '@/stores/dayPlanner/templateDayPlannerStore.ts'
	import { useTemplatePlannerTaskCrud } from '@/api/taskPlanner/templatePlannerTaskApi.ts'
	import { TemplatePlannerTaskRequest } from '@/dtos/request/activityPlanning/template/TemplatePlannerTaskRequest.ts'
	import type { TemplatePlannerTask } from '@/dtos/response/activityPlanning/template/TemplatePlannerTask.ts'
	import { TemplatePlannerTaskFilter } from '@/dtos/request/activityPlanning/template/TemplatePlannerTaskFilter.ts'
	import { useDateTime } from '@/utils/DateTimeHelper.ts'
	import { useUndoStack } from '@/composables/general/useUndoStack.ts'
	import { useClipboardHandling } from '@/composables/dayPlanner/useClipboardHandling.ts'
	import { usePlannerCrud } from '@/composables/dayPlanner/usePlannerCrud.ts'
	import { useRoute } from 'vue-router'
	import TemplatePlannerPanel from '@/components/dayPlanner/template/TemplatePlannerPanel.vue'

	const { storeId = 'main', isSplitView = false } = defineProps<{
		storeId?: 'main' | 'secondary'
		isSplitView?: boolean
	}>()

	const route = useRoute()
	const templateId = computed(() => (route.params.templateId ? parseInt(route.params.templateId as string) : null))

	const {
		createWithResponse: createTaskWithResponse,
		fetchFiltered: fetchFilteredTasks,
		update: updateTask,
		fetchById: fetchByIdTask,
		deleteEntity: deleteTask,
		batchDelete: batchDeleteTask,
	} = useTemplatePlannerTaskCrud()

	const { timeNiceFromMinutes } = useDateTime()
	const undoStack = useUndoStack()

	const store = storeId === 'secondary' ? useSecondaryTemplateDayPlannerStore() : useTemplateDayPlannerStore()

	function applyContext(req: TemplatePlannerTaskRequest) {
		req.templateId = templateId.value!
	}
	function buildRequestFromEntity(task: TemplatePlannerTask) {
		return TemplatePlannerTaskRequest.fromEntity(task)
	}

	useClipboardHandling(store, {
		createWithResponse: createTaskWithResponse,
		batchDelete: batchDeleteTask,
		applyContext,
		buildRequestFromEntity,
	})
	const crud = usePlannerCrud(store, {
		createWithResponse: createTaskWithResponse,
		update: updateTask,
		fetchById: fetchByIdTask,
		deleteEntity: deleteTask,
		batchDelete: batchDeleteTask,
		applyContext,
		buildRequestFromEntity,
	})

	provide('plannerStore', store)
	provide('isSplitView', isSplitView)
	provide('splitViewStoreId', storeId)

	const detailsHidden = ref(false)

	const taskStats = computed(() => {
		const nonBgTasks = store.tasks.filter(t => !t.isBackground)
		const taskCount = nonBgTasks.length
		const plannedMinutes = nonBgTasks.reduce((sum, t) => {
			const start = t.startTime.getInMinutes
			const end = t.endTime.getInMinutes
			return sum + (end > start ? end - start : end + 1440 - start)
		}, 0)
		const viewStart = store.viewStartTime.getInMinutes
		const viewEnd = store.viewEndTime.getInMinutes
		const totalViewMinutes = viewEnd > viewStart ? viewEnd - viewStart : viewEnd + 1440 - viewStart
		const freeMinutes = Math.max(0, totalViewMinutes - plannedMinutes)
		return { taskCount, plannedMinutes, freeMinutes }
	})

	onMounted(async () => {
		undoStack.clear()
		await loadTasks()
	})

	onUnmounted(() => {
		undoStack.clear()
	})

	async function loadTasks() {
		if (!templateId) return
		store.tasks = await fetchFilteredTasks(
			new TemplatePlannerTaskFilter(templateId.value, store.viewStartTime, store.viewEndTime),
		)
		store.initializeTaskGridPositions()
	}

	watch(
		[() => store.viewStartTime, () => store.viewEndTime],
		() => {
			loadTasks()
		},
		{ deep: true },
	)

	watch(
		() => templateId,
		async () => {
			store.resetStore()
			await loadTasks()
		},
	)

	defineExpose({ store, loadTasks })
</script>

<!-- TemplateDayPlannerView.vue -->
<template>
	<div class="py-4 d-flex flex-column flex-md-row ga-4 w-100 h-100">
		<VCard
			v-show="panelOpen || mdAndUp"
			class="d-flex flex-column"
			elevation="2"
			style="width: 400px; min-width: 280px"
		>
			<VCardTitle class="pt-4 px-5 pb-2 d-flex flex-column ga-2">
				<div class="d-flex justify-space-between align-center">
					<span class="text-grey-lighten-1">
						{{ activePanel === 'details' ? 'Template details' : 'Routine Tasks' }}
					</span>
					<VIconBtn
						class="d-md-none"
						color="secondaryOutline"
						icon="xmark"
						variant="tonal"
						size="36"
						@click="panelOpen = false"
					/>
				</div>
				<VBtnToggle
					v-model="activePanel"
					mandatory
					class="d-none d-md-flex"
					style="width: 100%"
					density="compact"
					variant="outlined"
					color="secondaryOutline"
				>
					<VBtn
						value="details"
						prependIcon="sliders"
						style="flex: 1"
					>
						Details
					</VBtn>
					<VBtn
						value="routine"
						prependIcon="rotate"
						style="flex: 1"
					>
						Routine
					</VBtn>
				</VBtnToggle>
			</VCardTitle>
			<TemplatePlannerPanel
				v-if="activePanel === 'details'"
				:templateId="templateId"
			/>
			<RoutineSidePanel
				v-else
				@update:selectedItem="selectedRoutineItem = $event"
			/>
		</VCard>

		<div
			class="flex-fill d-flex"
			style="position: relative; min-width: 0"
		>
			<DayPlanner
				class="flex-fill"
				:plannerStore="store"
				@delete="crud.del"
			>
				<template #header>
					<TemplatePlannerHeader :title="store.templateName || 'Day Template'">
						<template #headerPrepend>
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

				<template #selection-actions>
					<VBtn
						v-if="store.selectedTaskIds.size === 1"
						variant="tonal"
						color="secondaryOutline"
						@click="crud.splitTask"
					>
						Split
					</VBtn>
				</template>

				<template #dialog>
					<TemplatePlannerTaskDialog
						@create="crud.create"
						@edit="crud.edit"
					/>
				</template>
			</DayPlanner>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { computed, onMounted, onUnmounted, provide, ref, watch } from 'vue'
	import { useDisplay } from 'vuetify'
	import DayPlanner from '@/components/dayPlanner/DayPlanner.vue'
	import TemplatePlannerHeader from '@/components/dayPlanner/template/TemplatePlannerHeader.vue'
	import TemplatePlannerTaskDialog from '@/components/dayPlanner/template/TemplatePlannerTaskDialog.vue'
	import TemplatePlannerTaskBlock from '@/components/dayPlanner/template/TemplatePlannerTaskBlock.vue'
	import RoutineSidePanel from '@/components/dayPlanner/template/RoutineSidePanel.vue'
	import type { RoutineTodoListItemEntity } from '@/dtos/response/todoList/routine/RoutineTodoListItemEntity.ts'
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
	import { useLoading } from '@/composables/general/LoadingComposable.ts'

	const { storeId = 'main', isSplitView = false } = defineProps<{
		storeId?: 'main' | 'secondary'
		isSplitView?: boolean
	}>()

	const route = useRoute()
	const { mdAndUp } = useDisplay()
	const templateId = computed(() => (route.params.templateId ? parseInt(route.params.templateId as string) : null))

	const {
		createWithResponse: createTaskWithResponse,
		fetchFiltered: fetchFilteredTasks,
		update: updateTask,
		fetchById: fetchByIdTask,
		deleteEntity: deleteTask,
		batchDelete: batchDeleteTask,
	} = useTemplatePlannerTaskCrud()

	const { showFullScreenLoading } = useLoading()
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
		getCurrentContext: () => String(store.currentTemplateId),
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

	const activePanel = ref<'details' | 'routine'>('details')
	const panelOpen = ref(true)
	const selectedRoutineItem = ref<RoutineTodoListItemEntity | null>(null)

	provide('selectedRoutineItem', selectedRoutineItem)

	watch(activePanel, panel => {
		if (panel !== 'routine') selectedRoutineItem.value = null
	})

	watch(selectedRoutineItem, item => {
		store.placingItem = item ? { name: item.activity.name, icon: 'rotate' } : null
	})

	watch(
		() => store.placingItem,
		item => {
			if (!item) selectedRoutineItem.value = null
		},
	)

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
		if (templateId.value == null) return
		if (!isSplitView) showFullScreenLoading()
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

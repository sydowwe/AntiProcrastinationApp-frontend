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
								{{ taskStats.taskCount }} tasks · {{ fromMinutes(taskStats.plannedMinutes) }} planned ·
								<span :class="taskStats.freeMinutes > 0 ? 'text-success' : 'text-warning'">
									{{ fromMinutes(taskStats.freeMinutes) }} free
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
	import { computed, onMounted, provide, ref, watch } from 'vue'
	import { useDisplay } from 'vuetify'
	import DayPlanner from '@/core/dayPlanner/component/DayPlanner.vue'
	import TemplatePlannerHeader from '@/core/dayPlanner/component/template/TemplatePlannerHeader.vue'
	import TemplatePlannerTaskDialog from '@/core/dayPlanner/component/template/TemplatePlannerTaskDialog.vue'
	import TemplatePlannerTaskBlock from '@/core/dayPlanner/component/template/TemplatePlannerTaskBlock.vue'
	import RoutineSidePanel from '@/core/dayPlanner/component/template/RoutineSidePanel.vue'
	import type { RoutineTodoListItemEntity } from '@/core/todoList/dto/response/routine/RoutineTodoListItemEntity.ts'
	import {
		TEMPLATE_PLANNER_STORE_KEY,
		useSecondaryTemplateDayPlannerStore,
		useTemplateDayPlannerStore,
	} from '@/core/dayPlanner/store/templateDayPlannerStore.ts'
	import { PLANNER_STORE_KEY } from '@/core/dayPlanner/store/IBaseDayPlannerStore.ts'
	import { useTemplatePlannerTaskCrud } from '@/core/dayPlanner/api/templatePlannerTaskApi.ts'
	import { TemplatePlannerTaskRequest } from '@/core/dayPlanner/dto/request/template/TemplatePlannerTaskRequest.ts'
	import type { TemplatePlannerTask } from '@/core/dayPlanner/dto/response/template/TemplatePlannerTask.ts'
	import { TemplatePlannerTaskFilter } from '@/core/dayPlanner/dto/request/template/TemplatePlannerTaskFilter.ts'
	import { fromMinutes } from '@/_common/utils/formatDuration.ts'
	import { useUndoStack } from '@/_common/composable/general/useUndoStack.ts'
	import { useClipboardHandling } from '@/core/dayPlanner/composable/useClipboardHandling.ts'
	import { usePlannerCrud } from '@/core/dayPlanner/composable/usePlannerCrud.ts'
	import { useRoute } from 'vue-router'
	import TemplatePlannerPanel from '@/core/dayPlanner/component/template/TemplatePlannerPanel.vue'
	import { useLoading } from '@/_common/composable/general/LoadingComposable.ts'
	import { plannerInstancesMounted } from '@/core/dayPlanner/composable/usePlannerKeyboardScope.ts'

	const {
		storeId = 'main',
		isSplitView = false,
		templateId: templateIdProp = null,
	} = defineProps<{
		storeId?: 'main' | 'secondary'
		isSplitView?: boolean
		/** Passed by TemplateSplitView, which has no `:templateId` route param to read. */
		templateId?: number | null
	}>()

	const route = useRoute()
	const { mdAndUp } = useDisplay()

	// One source of truth for every consumer below: the split view hands the id down as a prop, the
	// standalone route carries it in the URL. `dayPlannerTemplate` deliberately does not set
	// `props: true` — that would deliver the param as a string and shadow this.
	const templateId = computed(
		() => templateIdProp ?? (route.params.templateId ? parseInt(route.params.templateId as string) : null),
	)

	const {
		createWithResponse: createTaskWithResponse,
		fetchFiltered: fetchFilteredTasks,
		update: updateTask,
		fetchById: fetchByIdTask,
		deleteEntity: deleteTask,
		batchDelete: batchDeleteTask,
	} = useTemplatePlannerTaskCrud()

	const { showFullScreenLoading } = useLoading()
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

	// Two keys, one store object: the second is for the few template-only components that need
	// `currentTemplateId` / `templateName`, which the shared contract deliberately does not carry.
	provide(PLANNER_STORE_KEY, store)
	provide(TEMPLATE_PLANNER_STORE_KEY, store)
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
		// Children mount first, so this instance is already counted: `<= 1` means this is the only
		// planner on screen and the stack can only hold entries left behind by an earlier view.
		// In the split view the second panel must not wipe the first panel's history.
		if (plannerInstancesMounted() <= 1) undoStack.clear()
		await loadTasks()
	})

	// Clearing on unmount is `usePlannerKeyboard`'s job — it is the one that knows whether the other
	// split-view panel is still alive.

	// A template switch legitimately fires loadTasks twice: once from the id watcher below, and once
	// when TemplatePlannerPanel writes the new template's wake/bed times into the store. Both are in
	// flight at the same time and the first one carries the previous template's view window, so only
	// the newest response may touch the store.
	let latestLoadToken = 0

	async function loadTasks() {
		const id = templateId.value
		if (id == null) return
		const token = ++latestLoadToken
		if (!isSplitView) showFullScreenLoading()
		const tasks = await fetchFilteredTasks(
			new TemplatePlannerTaskFilter(id, store.viewStartTime, store.viewEndTime),
		)
		if (token !== latestLoadToken) return
		store.tasks = tasks
		store.initializeTaskGridPositions()
	}

	watch(
		[() => store.viewStartTime, () => store.viewEndTime],
		() => {
			loadTasks()
		},
		{ deep: true },
	)

	// Watch the value, not the ref: `() => templateId` returns the computed object, whose identity
	// never changes, so the previous form fired exactly never.
	watch(templateId, async () => {
		store.resetStore()
		await loadTasks()
	})

	defineExpose({ store, loadTasks })
</script>

<template>
	<div class="py-6 w-100">
		<div class="mb-5 d-flex justify-space-between align-center">
			<h1 class="text-h4">Day Templates</h1>
			<div class="d-flex align-center ga-3">
				<template v-if="mdAndUp && templates.length >= 2">
					<VBtn
						v-if="!compareMode"
						color="secondaryOutline"
						variant="tonal"
						prependIcon="columns"
						@click="compareMode = true"
					>
						Compare
					</VBtn>
					<template v-else>
						<VBtn
							color="primary"
							prependIcon="columns"
							:disabled="compareSelection.length !== 2"
							@click="openComparison"
						>
							Compare ({{ compareSelection.length }}/2)
						</VBtn>
						<VBtn
							color="secondaryOutline"
							variant="outlined"
							@click="exitCompareMode"
						>
							Cancel
						</VBtn>
					</template>
				</template>
				<VSelect
					v-model="sortBy"
					:items="sortOptions"
					density="compact"
					variant="outlined"
					hideDetails
					style="min-width: 170px"
				/>
				<VBtn
					v-if="mdAndUp"
					color="secondaryOutline"
					variant="tonal"
					prependIcon="code-compare"
					@click="router.push({ name: 'dayPlannerTemplateSplit' })"
				>
					Edit Side by Side
				</VBtn>
				<VBtn
					color="primary"
					prependIcon="plus"
					@click="openCreateDialog"
				>
					Add Template
				</VBtn>
			</div>
		</div>

		<VRow
			class="w-100 mt-16"
			v-if="!templates.length && !fullScreenLoading"
			justify="center"
		>
			<VCol
				cols="12"
				lg="4"
			>
				<VCard
					class="text-center pa-8"
					variant="flat"
				>
					<VIcon
						icon="calendar-plus"
						size="48"
						class="mb-4 text-grey"
					/>
					<div class="text-h6 mb-2">No templates yet</div>
					<VBtn
						color="primary"
						@click="openCreateDialog"
					>
						Create your first template
					</VBtn>
				</VCard>
			</VCol>
		</VRow>

		<template v-if="templates.length && !fullScreenLoading">
			<!-- Pinned templates -->
			<template v-if="pinnedTemplates.length">
				<div class="ml-2 mb-3 text-h6">
					<VIcon
						icon="thumbtack"
						size="12"
						class="mr-1"
					/>
					Pinned
				</div>
				<VRow>
					<VCol
						v-for="template in pinnedTemplates"
						:key="template.id"
						cols="12"
						md="6"
						lg="4"
					>
						<div
							:ref="
								(el: HTMLElement) =>
									registerCard(el as HTMLElement, template.id, 'pinned', () =>
										pinnedTemplates.map(t => t.id),
									)
							"
							:class="{
								'drag-over-before':
									dragOverState?.templateId === template.id && dragOverState?.position === 'before',
								'drag-over-after':
									dragOverState?.templateId === template.id && dragOverState?.position === 'after',
							}"
							class="template-drag-wrapper"
						>
							<TemplateCard
								:template
								isPinned
								:tasks="templateTasksMap.get(template.id)"
								:compareMode="compareMode"
								:isCompareSelected="compareSelection.includes(template.id)"
								@click="openTemplate(template.id)"
								@edit="openEditDialog(template)"
								@delete="confirmDelete(template)"
								@togglePin="togglePin(template.id)"
								@toggleActive="toggleActive(template)"
								@applyToday="applyToToday(template.id)"
								@duplicate="duplicateTemplate(template)"
								@toggleCompare="toggleCompareSelection(template.id)"
							/>
						</div>
					</VCol>
				</VRow>
				<VDivider
					v-if="unpinnedTemplates.length"
					class="my-5"
				/>
			</template>

			<!-- Active unpinned templates -->
			<VRow v-if="activeUnpinnedTemplates.length">
				<VCol
					v-for="template in activeUnpinnedTemplates"
					:key="template.id"
					cols="12"
					md="6"
					lg="4"
				>
					<div
						:ref="
							(el: HTMLElement) =>
								registerCard(el as HTMLElement, template.id, 'active', () =>
									activeUnpinnedTemplates.map(t => t.id),
								)
						"
						:class="{
							'drag-over-before':
								dragOverState?.templateId === template.id && dragOverState?.position === 'before',
							'drag-over-after':
								dragOverState?.templateId === template.id && dragOverState?.position === 'after',
						}"
						class="template-drag-wrapper h-100"
					>
						<TemplateCard
							:template
							:isPinned="false"
							:tasks="templateTasksMap.get(template.id)"
							:compareMode="compareMode"
							:isCompareSelected="compareSelection.includes(template.id)"
							@click="openTemplate(template.id)"
							@edit="openEditDialog(template)"
							@delete="confirmDelete(template)"
							@togglePin="togglePin(template.id)"
							@toggleActive="toggleActive(template)"
							@applyToday="applyToToday(template.id)"
							@duplicate="duplicateTemplate(template)"
							@toggleCompare="toggleCompareSelection(template.id)"
						/>
					</div>
				</VCol>
			</VRow>

			<!-- Inactive templates -->
			<template v-if="inactiveUnpinnedTemplates.length">
				<VDivider class="mt-5 mb-2" />
				<div class="ml-2 mb-3 text-h6">
					<VIcon
						icon="eye-slash"
						size="12"
						class="mr-1"
					/>
					Inactive
				</div>
				<VRow>
					<VCol
						v-for="template in inactiveUnpinnedTemplates"
						:key="template.id"
						cols="12"
						md="6"
						lg="4"
					>
						<div
							:ref="
								(el: HTMLElement) =>
									registerCard(el as HTMLElement, template.id, 'inactive', () =>
										inactiveUnpinnedTemplates.map(t => t.id),
									)
							"
							:class="{
								'drag-over-before':
									dragOverState?.templateId === template.id && dragOverState?.position === 'before',
								'drag-over-after':
									dragOverState?.templateId === template.id && dragOverState?.position === 'after',
							}"
							class="template-drag-wrapper"
						>
							<TemplateCard
								:template
								:isPinned="false"
								:tasks="templateTasksMap.get(template.id)"
								:compareMode="compareMode"
								:isCompareSelected="compareSelection.includes(template.id)"
								@click="openTemplate(template.id)"
								@edit="openEditDialog(template)"
								@delete="confirmDelete(template)"
								@togglePin="togglePin(template.id)"
								@toggleActive="toggleActive(template)"
								@applyToday="applyToToday(template.id)"
								@duplicate="duplicateTemplate(template)"
								@toggleCompare="toggleCompareSelection(template.id)"
							/>
						</div>
					</VCol>
				</VRow>
			</template>
		</template>

		<!-- Create/Edit Dialog -->
		<TemplateDetailsDialog
			v-model="dialog"
			:template="editingTemplate"
			:defaultValues="duplicateDefaultValues"
			@save="handleSaveTemplate"
		/>

		<!-- Delete Confirmation Dialog -->
		<MyDialog
			v-model="deleteDialog"
			title="Confirm Delete"
			confirmBtnColor="errorDark"
			confirmBtnLabel="Delete"
			@confirmed="deleteTemplate"
		>
			Are you sure you want to delete "{{ templateToDelete?.name }}"? This action cannot be undone.
		</MyDialog>

		<!-- Comparison Dialog -->
		<TemplateComparisonDialog
			v-model="compareDialog"
			:templateIds="compareSelection"
		/>
	</div>
</template>

<script setup lang="ts">
	import { computed, onMounted, ref, watch } from 'vue'
	import { useRouter } from 'vue-router'
	import { useTaskPlannerDayTemplateTaskCrud } from '@/api/taskPlanner/taskPlannerDayTemplateApi.ts'
	import type { TaskPlannerDayTemplate } from '@/dtos/response/activityPlanning/template/TaskPlannerDayTemplate.ts'
	import { TaskPlannerDayTemplateRequest } from '@/dtos/request/activityPlanning/template/TaskPlannerDayTemplateRequest.ts'
	import TemplateDetailsDialog from '@/components/dayPlanner/template/TemplateDetailsDialog.vue'
	import MyDialog from '@/components/general/dialogs/MyDialog.vue'
	import TemplateCard from '@/components/dayPlanner/template/TemplateCard.vue'
	import TemplateComparisonDialog from '@/components/dayPlanner/template/TemplateComparisonDialog.vue'
	import { useSnackbar } from '@/composables/general/SnackbarComposable.ts'
	import { useDateTime } from '@/utils/DateTimeHelper.ts'
	import { useTemplatePlannerTaskCrud } from '@/api/taskPlanner/templatePlannerTaskApi.ts'
	import { TemplatePlannerTaskFilter } from '@/dtos/request/activityPlanning/template/TemplatePlannerTaskFilter.ts'
	import { TemplatePlannerTaskRequest } from '@/dtos/request/activityPlanning/template/TemplatePlannerTaskRequest.ts'
	import { Time } from '@/dtos/dto/Time.ts'
	import type { TemplatePlannerTask } from '@/dtos/response/activityPlanning/template/TemplatePlannerTask.ts'

	import { useDisplay } from 'vuetify'
	import { useLoading } from '@/composables/general/LoadingComposable.ts'
	import { useTemplateCardDragAndDrop } from '@/composables/dayPlanner/useTemplateCardDragAndDrop.ts'

	const { showFullScreenLoading, hideFullScreenLoading, fullScreenLoading, axiosSuccessLoadingHide } = useLoading()
	const { mdAndUp } = useDisplay()
	const router = useRouter()
	const { fetchAll, create, update, deleteEntity } = useTaskPlannerDayTemplateTaskCrud()
	const { fetchFiltered: fetchFilteredTasks, createWithResponse: createTaskWithResponse } =
		useTemplatePlannerTaskCrud()
	const { showSuccessSnackbar } = useSnackbar()
	const { formatToUsString, usStringToUrlString } = useDateTime()

	const templates = ref<TaskPlannerDayTemplate[]>([])
	const templateTasksMap = ref<Map<number, TemplatePlannerTask[]>>(new Map())

	type SortOption = 'mostUsed' | 'recentlyUsed' | 'alphabetical'
	const sortBy = ref<SortOption>('mostUsed')
	const sortOptions = [
		{ title: 'Most Used', value: 'mostUsed' },
		{ title: 'Recently Used', value: 'recentlyUsed' },
		{ title: 'Alphabetical', value: 'alphabetical' },
	]

	function activeFirst(a: { isActive: boolean }, b: { isActive: boolean }) {
		return Number(b.isActive) - Number(a.isActive)
	}

	const sortedTemplates = computed(() => {
		const sorted = [...templates.value]
		switch (sortBy.value) {
			case 'mostUsed':
				return sorted.sort((a, b) => activeFirst(a, b) || b.usageCount - a.usageCount)
			case 'recentlyUsed':
				return sorted.sort((a, b) => {
					if (activeFirst(a, b) !== 0) return activeFirst(a, b)
					if (!a.lastUsedAt && !b.lastUsedAt) return 0
					if (!a.lastUsedAt) return 1
					if (!b.lastUsedAt) return -1
					return new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime()
				})
			case 'alphabetical':
				return sorted.sort((a, b) => activeFirst(a, b) || a.name.localeCompare(b.name))
			default:
				return sorted.sort(activeFirst)
		}
	})

	const PINNED_KEY = 'pinnedTemplateIds'
	const pinnedIds = ref<Set<number>>(new Set(JSON.parse(localStorage.getItem(PINNED_KEY) || '[]')))
	watch(pinnedIds, val => localStorage.setItem(PINNED_KEY, JSON.stringify([...val])), { deep: true })

	const { applyOrder, registerCard, dragOverState } = useTemplateCardDragAndDrop()

	const pinnedTemplates = computed(() =>
		applyOrder(
			sortedTemplates.value.filter(t => pinnedIds.value.has(t.id)),
			'pinned',
		),
	)
	const unpinnedTemplates = computed(() => sortedTemplates.value.filter(t => !pinnedIds.value.has(t.id)))
	const activeUnpinnedTemplates = computed(() =>
		applyOrder(
			unpinnedTemplates.value.filter(t => t.isActive),
			'active',
		),
	)
	const inactiveUnpinnedTemplates = computed(() =>
		applyOrder(
			unpinnedTemplates.value.filter(t => !t.isActive),
			'inactive',
		),
	)

	function togglePin(templateId: number) {
		if (pinnedIds.value.has(templateId)) {
			pinnedIds.value.delete(templateId)
		} else {
			pinnedIds.value.add(templateId)
		}
	}

	async function toggleActive(template: TaskPlannerDayTemplate) {
		const request = TaskPlannerDayTemplateRequest.fromEntity(template)
		request.isActive = !template.isActive
		await update(template.id, request)
		await loadTemplates()
	}

	const dialog = ref(false)
	const deleteDialog = ref(false)
	const templateToDelete = ref<TaskPlannerDayTemplate | null>(null)
	const editingTemplate = ref<TaskPlannerDayTemplate | null>(null)
	const duplicateDefaultValues = ref<TaskPlannerDayTemplateRequest | null>(null)
	const duplicatingFromId = ref<number | null>(null)

	// Comparison mode
	const compareMode = ref(false)
	const compareSelection = ref<number[]>([])
	const compareDialog = ref(false)

	function toggleCompareSelection(templateId: number) {
		const idx = compareSelection.value.indexOf(templateId)
		if (idx >= 0) {
			compareSelection.value.splice(idx, 1)
		} else if (compareSelection.value.length < 2) {
			compareSelection.value.push(templateId)
		}
	}

	function openComparison() {
		if (compareSelection.value.length === 2) {
			compareDialog.value = true
		}
	}

	function exitCompareMode() {
		compareMode.value = false
		compareSelection.value = []
	}

	async function loadTemplates() {
		showFullScreenLoading()
		axiosSuccessLoadingHide.value = false
		templates.value = await fetchAll()
		// Fetch tasks for mini-timeline previews
		const taskResults = await Promise.all(
			templates.value.map(t =>
				fetchFilteredTasks(new TemplatePlannerTaskFilter(t.id, t.defaultWakeUpTime, t.defaultBedTime)).then(
					tasks => [t.id, tasks] as const,
				),
			),
		)
		templateTasksMap.value = new Map(taskResults)
		hideFullScreenLoading()
	}

	function openCreateDialog() {
		editingTemplate.value = null
		dialog.value = true
	}

	function openEditDialog(template: TaskPlannerDayTemplate) {
		editingTemplate.value = template
		dialog.value = true
	}

	function closeDialog() {
		dialog.value = false
		editingTemplate.value = null
		duplicateDefaultValues.value = null
		duplicatingFromId.value = null
	}

	function duplicateTemplate(template: TaskPlannerDayTemplate) {
		const defaults = TaskPlannerDayTemplateRequest.fromEntity(template)
		defaults.name = `${template.name} (copy)`
		duplicateDefaultValues.value = defaults
		duplicatingFromId.value = template.id
		editingTemplate.value = null
		dialog.value = true
	}

	async function handleSaveTemplate(request: TaskPlannerDayTemplateRequest) {
		if (editingTemplate.value) {
			await update(editingTemplate.value.id, request)
			await loadTemplates()
			closeDialog()
			showSuccessSnackbar('Template updated')
		} else {
			const newId = await create(request)

			// If duplicating, copy all tasks from the original template
			if (duplicatingFromId.value) {
				const originalTasks = await fetchFilteredTasks(
					new TemplatePlannerTaskFilter(duplicatingFromId.value, new Time(0, 0), new Time(23, 50)),
				)
				await Promise.all(
					originalTasks.map(task => {
						const taskRequest = TemplatePlannerTaskRequest.fromEntity(task)
						taskRequest.templateId = newId as number
						return createTaskWithResponse(taskRequest)
					}),
				)
			}

			closeDialog()
			await router.push({
				name: 'dayPlannerTemplate',
				params: { templateId: newId },
			})
		}
	}

	function openTemplate(templateId: number) {
		router.push({
			name: 'dayPlannerTemplate',
			params: { templateId },
		})
	}

	function applyToToday(templateId: number) {
		const todayUrlDate = usStringToUrlString(formatToUsString(new Date()))
		router.push({
			name: 'dayPlanner',
			params: { date: todayUrlDate },
			query: { applyTemplateId: templateId.toString() },
		})
	}

	function confirmDelete(template: TaskPlannerDayTemplate) {
		templateToDelete.value = template
		deleteDialog.value = true
	}

	async function deleteTemplate() {
		if (templateToDelete.value) {
			await deleteEntity(templateToDelete.value.id)
			await loadTemplates()
			deleteDialog.value = false
			templateToDelete.value = null
			showSuccessSnackbar('Template deleted')
		}
	}

	onMounted(async () => {
		await loadTemplates()
	})
</script>
<style scoped>
	.v-col-lg-4 {
		padding: 10px;
	}

	.template-drag-wrapper {
		position: relative;
		cursor: grab;
	}

	.template-drag-wrapper:active {
		cursor: grabbing;
	}

	.template-drag-wrapper.drag-over-before::before,
	.template-drag-wrapper.drag-over-after::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		height: 3px;
		background: rgb(var(--v-theme-primary));
		border-radius: 2px;
		z-index: 10;
	}

	.template-drag-wrapper.drag-over-before::before {
		top: 0;
	}

	.template-drag-wrapper.drag-over-after::after {
		bottom: 0;
	}
</style>

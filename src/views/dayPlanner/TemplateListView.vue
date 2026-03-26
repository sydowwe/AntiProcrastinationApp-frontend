<template>
<div class="py-4">
	<VRow>
		<VCol cols="12">
			<div class="d-flex justify-space-between align-center mb-4">
				<h1 class="text-h4">Day Templates</h1>
				<div class="d-flex align-center ga-3">
					<VSelect
						v-model="sortBy"
						:items="sortOptions"
						density="compact"
						variant="outlined"
						hideDetails
						style="min-width: 170px"
					/>
					<VBtn
						color="primary"
						prependIcon="plus"
						@click="openCreateDialog"
					>
						Add Template
					</VBtn>
				</div>
			</div>
		</VCol>
	</VRow>

	<VRow v-if="loading">
		<VCol cols="12" class="d-flex justify-center pa-8">
			<VProgressCircular indeterminate color="primary" />
		</VCol>
	</VRow>

	<VRow v-else-if="!templates.length">
		<VCol cols="12">
			<VCard class="text-center pa-8" variant="flat">
				<VIcon icon="calendar-plus" size="48" class="mb-4 text-grey" />
				<div class="text-h6 mb-2">No templates yet</div>
				<VBtn color="primary" @click="openCreateDialog">Create your first template</VBtn>
			</VCard>
		</VCol>
	</VRow>

	<template v-if="templates.length">
		<!-- Pinned templates -->
		<template v-if="pinnedTemplates.length">
			<VRow>
				<VCol cols="12" class="pb-0">
					<span class="text-caption text-medium-emphasis">
						<VIcon icon="thumbtack" size="12" class="mr-1" />
						Pinned
					</span>
				</VCol>
			</VRow>
			<VRow>
				<VCol
					v-for="template in pinnedTemplates"
					:key="template.id"
					cols="12"
					md="6"
					lg="4"
				>
					<TemplateCard
						:template
						:isPinned="true"
						:tasks="templateTasksMap.get(template.id)"
						@click="openTemplate(template.id)"
						@edit="openEditDialog(template)"
						@delete="confirmDelete(template)"
						@togglePin="togglePin(template.id)"
						@toggleActive="toggleActive(template)"
						@applyToday="applyToToday(template.id)"
						@duplicate="duplicateTemplate(template)"
					/>
				</VCol>
			</VRow>
			<VDivider v-if="unpinnedTemplates.length" class="my-2" />
		</template>

		<!-- Unpinned templates -->
		<VRow v-if="unpinnedTemplates.length">
			<VCol
				v-for="template in unpinnedTemplates"
				:key="template.id"
				cols="12"
				md="6"
				lg="4"
			>
				<TemplateCard
					:template
					:isPinned="false"
					:tasks="templateTasksMap.get(template.id)"
					@click="openTemplate(template.id)"
					@edit="openEditDialog(template)"
					@delete="confirmDelete(template)"
					@togglePin="togglePin(template.id)"
					@toggleActive="toggleActive(template)"
					@applyToday="applyToToday(template.id)"
					@duplicate="duplicateTemplate(template)"
				/>
			</VCol>
		</VRow>
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
		Are you sure you want to delete "{{ templateToDelete?.name }}"?
		This action cannot be undone.
	</MyDialog>
</div>
</template>

<script setup lang="ts">
import {computed, onMounted, ref, watch} from 'vue'
import {useRouter} from 'vue-router'
import {useTaskPlannerDayTemplateTaskCrud} from '@/api/taskPlanner/taskPlannerDayTemplateApi.ts'
import type {TaskPlannerDayTemplate} from '@/dtos/response/activityPlanning/template/TaskPlannerDayTemplate.ts'
import {TaskPlannerDayTemplateRequest} from '@/dtos/request/activityPlanning/template/TaskPlannerDayTemplateRequest.ts'
import TemplateDetailsDialog from '@/components/dayPlanner/template/TemplateDetailsDialog.vue'
import MyDialog from '@/components/dialogs/MyDialog.vue'
import TemplateCard from '@/components/dayPlanner/template/TemplateCard.vue';
import {useSnackbar} from '@/composables/general/SnackbarComposable.ts';
import {useMoment} from '@/utils/momentHelper.ts';
import {useTemplatePlannerTaskCrud} from '@/api/taskPlanner/templatePlannerTaskApi.ts';
import {TemplatePlannerTaskFilter} from '@/dtos/request/activityPlanning/template/TemplatePlannerTaskFilter.ts';
import {TemplatePlannerTaskRequest} from '@/dtos/request/activityPlanning/template/TemplatePlannerTaskRequest.ts';
import {Time} from '@/dtos/dto/Time.ts';
import type {TemplatePlannerTask} from '@/dtos/response/activityPlanning/template/TemplatePlannerTask.ts';

const router = useRouter()
const {fetchAll, create, update, deleteEntity} = useTaskPlannerDayTemplateTaskCrud()
const {fetchFiltered: fetchFilteredTasks, createWithResponse: createTaskWithResponse} = useTemplatePlannerTaskCrud()
const {showSuccessSnackbar} = useSnackbar()
const {formatToUsString, usStringToUrlString} = useMoment()

const templates = ref<TaskPlannerDayTemplate[]>([])
const templateTasksMap = ref<Map<number, TemplatePlannerTask[]>>(new Map())
const loading = ref(false)

type SortOption = 'mostUsed' | 'recentlyUsed' | 'alphabetical'
const sortBy = ref<SortOption>('mostUsed')
const sortOptions = [
	{title: 'Most Used', value: 'mostUsed'},
	{title: 'Recently Used', value: 'recentlyUsed'},
	{title: 'Alphabetical', value: 'alphabetical'},
]

const sortedTemplates = computed(() => {
	const sorted = [...templates.value]
	switch (sortBy.value) {
		case 'mostUsed':
			return sorted.sort((a, b) => b.usageCount - a.usageCount)
		case 'recentlyUsed':
			return sorted.sort((a, b) => {
				if (!a.lastUsedAt && !b.lastUsedAt) return 0
				if (!a.lastUsedAt) return 1
				if (!b.lastUsedAt) return -1
				return new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime()
			})
		case 'alphabetical':
			return sorted.sort((a, b) => a.name.localeCompare(b.name))
		default:
			return sorted
	}
})

const PINNED_KEY = 'pinnedTemplateIds'
const pinnedIds = ref<Set<number>>(new Set(JSON.parse(localStorage.getItem(PINNED_KEY) || '[]')))
watch(pinnedIds, (val) => localStorage.setItem(PINNED_KEY, JSON.stringify([...val])), {deep: true})

const pinnedTemplates = computed(() => sortedTemplates.value.filter(t => pinnedIds.value.has(t.id)))
const unpinnedTemplates = computed(() => sortedTemplates.value.filter(t => !pinnedIds.value.has(t.id)))

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

async function loadTemplates() {
	loading.value = true
	try {
		templates.value = await fetchAll()
		// Fetch tasks for mini-timeline previews
		const taskResults = await Promise.all(
			templates.value.map(t =>
				fetchFilteredTasks(new TemplatePlannerTaskFilter(t.id, t.defaultWakeUpTime, t.defaultBedTime))
					.then(tasks => [t.id, tasks] as const)
			)
		)
		templateTasksMap.value = new Map(taskResults)
	} finally {
		loading.value = false
	}
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
				new TemplatePlannerTaskFilter(duplicatingFromId.value, new Time(0, 0), new Time(23, 50))
			)
			await Promise.all(originalTasks.map(task => {
				const taskRequest = TemplatePlannerTaskRequest.fromEntity(task)
				taskRequest.templateId = newId as number
				return createTaskWithResponse(taskRequest)
			}))
		}

		closeDialog()
		await router.push({
			name: 'dayPlannerTemplate',
			params: {templateId: newId}
		})
	}
}

function openTemplate(templateId: number) {
	router.push({
		name: 'dayPlannerTemplate',
		params: {templateId}
	})
}

function applyToToday(templateId: number) {
	const todayUrlDate = usStringToUrlString(formatToUsString(new Date()))
	router.push({
		name: 'dayPlanner',
		params: {date: todayUrlDate},
		query: {applyTemplateId: templateId.toString()}
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


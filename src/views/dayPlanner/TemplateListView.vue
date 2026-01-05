<template>
<VContainer fluid>
	<VRow>
		<VCol cols="12">
			<div class="d-flex justify-space-between align-center mb-4">
				<h1 class="text-h4">Day Templates</h1>
				<VBtn
					color="primary"
					prependIcon="plus"
					@click="openCreateDialog"
				>
					Add Template
				</VBtn>
			</div>
		</VCol>
	</VRow>

	<VRow>
		<VCol
			v-for="template in templates"
			:key="template.id"
			cols="12"
			md="6"
			lg="4"
		>
			<VCard
				class="template-card"
				:class="{ 'inactive-template': !template.isActive }"
				elevation="2"
				@click="openTemplate(template.id)"
			>
				<VCardTitle class="d-flex justify-space-between align-center">
					<div class="d-flex align-center ga-2">
						<VIcon v-if="template.icon">{{ template.icon }}</VIcon>
						<span>{{ template.name }}</span>
					</div>
					<VChip
						v-if="!template.isActive"
						size="small"
						color="warning"
					>
						Inactive
					</VChip>
				</VCardTitle>

				<VCardText>
					<div v-if="template.description" class="mb-2">
						{{ template.description }}
					</div>

					<div class="template-meta">
						<VChip
							v-if="template.suggestedForDayType"
							size="small"
							color="primary"
							variant="tonal"
							class="mr-2 mb-2"
						>
							{{ template.suggestedForDayType }}
						</VChip>

						<VChip
							v-for="tag in template.tags"
							:key="tag"
							size="small"
							variant="outlined"
							class="mr-2 mb-2"
						>
							{{ tag }}
						</VChip>
					</div>

					<div class="d-flex justify-space-between align-center mt-3 text-caption">
						<span>Used {{ template.usageCount }} times</span>
						<span v-if="template.lastUsedAt">
							Last: {{ formatDate(template.lastUsedAt) }}
						</span>
					</div>
				</VCardText>

				<VCardActions>
					<VSpacer/>
					<VBtn
						size="small"
						variant="text"
						@click.stop="openEditDialog(template)"
					>
						Edit Details
					</VBtn>
					<VBtn
						size="small"
						variant="text"
						color="error"
						@click.stop="confirmDelete(template)"
					>
						Delete
					</VBtn>
				</VCardActions>
			</VCard>
		</VCol>
	</VRow>

	<!-- Create/Edit Dialog -->
	<VDialog
		v-model="dialog"
		maxWidth="600"
		persistent
	>
		<TaskPlannerDayTemplateDetailsForm
			ref="templateForm"
			:template="editingTemplate"
			@updateDetails="handleSaveTemplate"
		/>
		<VCardActions class="pa-4">
			<VSpacer/>
			<VBtn
				variant="text"
				@click="closeDialog"
			>
				Cancel
			</VBtn>
		</VCardActions>
	</VDialog>

	<!-- Delete Confirmation Dialog -->
	<VDialog
		v-model="deleteDialog"
		maxWidth="400"
	>
		<VCard>
			<VCardTitle>Confirm Delete</VCardTitle>
			<VCardText>
				Are you sure you want to delete "{{ templateToDelete?.name }}"?
				This action cannot be undone.
			</VCardText>
			<VCardActions>
				<VSpacer/>
				<VBtn
					variant="text"
					@click="deleteDialog = false"
				>
					Cancel
				</VBtn>
				<VBtn
					color="error"
					variant="text"
					@click="deleteTemplate"
				>
					Delete
				</VBtn>
			</VCardActions>
		</VCard>
	</VDialog>
</VContainer>
</template>

<script setup lang="ts">
import {onMounted, ref} from 'vue'
import {useRouter} from 'vue-router'
import {useTaskPlannerDayTemplateTaskCrud} from '@/composables/ConcretesCrudComposable.ts'
import type {TaskPlannerDayTemplate} from '@/dtos/response/activityPlanning/template/TaskPlannerDayTemplate.ts'
import type {TaskPlannerDayTemplateRequest} from '@/dtos/request/activityPlanning/template/TaskPlannerDayTemplateRequest.ts'
import TaskPlannerDayTemplateDetailsForm from '@/components/dayPlanner/template/TaskPlannerDayTemplateDetailsForm.vue'

const router = useRouter()
const {fetchAll, create, update, deleteEntity} = useTaskPlannerDayTemplateTaskCrud()

const templates = ref<TaskPlannerDayTemplate[]>([])
const dialog = ref(false)
const deleteDialog = ref(false)
const templateToDelete = ref<TaskPlannerDayTemplate | null>(null)
const templateForm = ref<InstanceType<typeof TaskPlannerDayTemplateDetailsForm> | null>(null)
const editingTemplateId = ref<number | null>(null)
const editingTemplate = ref<TaskPlannerDayTemplate | null>(null)

async function loadTemplates() {
	templates.value = await fetchAll()
}

function openCreateDialog() {
	editingTemplateId.value = null
	editingTemplate.value = null
	dialog.value = true
}

function openEditDialog(template: TaskPlannerDayTemplate) {
	editingTemplateId.value = template.id
	editingTemplate.value = template
	dialog.value = true
}

function closeDialog() {
	dialog.value = false
	editingTemplateId.value = null
	editingTemplate.value = null
}

async function handleSaveTemplate(request: TaskPlannerDayTemplateRequest) {
	if (editingTemplateId.value) {
		// Update existing template
		await update(editingTemplateId.value, request)
		await loadTemplates()
		closeDialog()
	} else {
		const id = await create(request)
		closeDialog()
		// Navigate to the template day planner with the new template ID
		await router.push({
			name: 'dayPlannerTemplate',
			params: {templateId: id}
		})
	}
}

function openTemplate(templateId: number) {
	router.push({
		name: 'dayPlannerTemplate',
		params: {templateId}
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
	}
}

function formatDate(dateString: string): string {
	const date = new Date(dateString)
	return date.toLocaleDateString()
}

onMounted(() => {
	loadTemplates()
})
</script>

<style scoped>
.template-card {
	cursor: pointer;
	transition: transform 0.2s, box-shadow 0.2s;
}

.template-card:hover {
	transform: translateY(-4px);
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.inactive-template {
	opacity: 0.7;
}

.template-meta {
	min-height: 32px;
}
</style>

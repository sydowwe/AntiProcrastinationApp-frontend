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
				<VCardTitle class="pa-4 d-flex justify-space-between align-center">
					<div class="d-flex align-center ga-2">
						<VIcon class="ma-1" v-if="template.icon">{{ template.icon }}</VIcon>
						<span>{{ template.name }}</span>
						<VChip
							v-if="!template.isActive"
							size="small"
							color="warning"
						>
							<VIcon icon="triangle-exclamation" class="mr-1"></VIcon>
							Inactive
						</VChip>
					</div>
					<DayTypeChip :dayType="template.suggestedForDayType" isTonal></DayTypeChip>
				</VCardTitle>

				<VCardText>
					<div v-if="template.description" class="mb-2">
						{{ template.description }}
					</div>

					<div class="template-meta">
						<VChip
							v-for="tag in template.tags"
							:key="tag"
							size="small"
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

				<VCardActions class="pa-4">
					<VSpacer/>
					<VBtn
						color="secondaryOutline"
						variant="tonal"
						@click.stop="openEditDialog(template)"
					>
						Edit Details
					</VBtn>
					<VBtn
						variant="tonal"
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
	<TemplateDetailsDialog
		v-model="dialog"
		:template="editingTemplate"
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
</VContainer>
</template>

<script setup lang="ts">
import {onMounted, ref} from 'vue'
import {useRouter} from 'vue-router'
import {useTaskPlannerDayTemplateTaskCrud} from '@/api/ConcretesCrudComposable.ts'
import type {TaskPlannerDayTemplate} from '@/dtos/response/activityPlanning/template/TaskPlannerDayTemplate.ts'
import type {TaskPlannerDayTemplateRequest} from '@/dtos/request/activityPlanning/template/TaskPlannerDayTemplateRequest.ts'
import TemplateDetailsDialog from '@/components/dayPlanner/template/TemplateDetailsDialog.vue'
import MyDialog from '@/components/dialogs/MyDialog.vue'
import DayTypeChip from '@/components/dayPlanner/misc/DayTypeChip.vue';

const router = useRouter()
const {fetchAll, create, update, deleteEntity} = useTaskPlannerDayTemplateTaskCrud()

const templates = ref<TaskPlannerDayTemplate[]>([])
const dialog = ref(false)
const deleteDialog = ref(false)
const templateToDelete = ref<TaskPlannerDayTemplate | null>(null)
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

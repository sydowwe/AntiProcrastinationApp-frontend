<template>
<VCard class="detailPanel h-100 pa-4 py-6 d-flex flex-column ga-6">
	<VBtn
		variant="outlined"
		color="secondaryOutline"
		@click="emit('openDetails')"
	>
		<VIcon icon="pen-to-square" size="18" class="mr-2"/>
		Edit Details
	</VBtn>
	<div>
		<div class="d-flex ga-2">
			<VAutocomplete label="Template" v-model="selectedTemplate" :items="templates" item-title="name" item-value="id" returnObject></VAutocomplete>
			<VBtn color="primary" :disabled="!selectedTemplate" @click="emit('useTemplate', selectedTemplate!)">Use</VBtn>
		</div>
		<div v-if="selectedTemplate">
			<span>{{ Time.getString(selectedTemplate.defaultWakeUpTime) }} - {{ Time.getString(selectedTemplate.defaultBedTime) }}</span>
			<div>{{ selectedTemplate.name }}</div>
			<div>{{ selectedTemplate.description }}</div>
			<div>{{ selectedTemplate.suggestedForDayType }}</div>
			<div>{{ selectedTemplate.tags.join(', ') }}</div>
		</div>
		<div v-if="calendar?.appliedTemplateName" class="detail-chip">
			<VIcon icon="file-lines" size="18" color="secondary"/>
			<span>Template: {{ calendar?.appliedTemplateName }}</span>
		</div>
	</div>

	<div v-if="calendar?.weather" class="detail-chip">
		<VIcon icon="cloud-sun" size="18" color="info"/>
		<span>{{ calendar?.weather }}</span>
	</div>


	<div v-if="calendar?.label" class="detail-chip">
		<VIcon icon="tag" size="18" color="warning"/>
		<span>{{ calendar?.label }}</span>
	</div>

	<div v-if="calendar?.notes" class="detail-chip notes-chip">
		<VIcon icon="note-sticky" size="18" color="warning"/>
		<span>{{ calendar?.notes }}</span>
	</div>
</VCard>
</template>

<script setup lang="ts">
import type {Calendar} from '@/dtos/response/activityPlanning/Calendar.ts';
import {useTaskPlannerDayTemplateTaskCrud} from '@/composables/ConcretesCrudComposable.ts';
import {onMounted, ref} from 'vue';
import type {TaskPlannerDayTemplate} from '@/dtos/response/activityPlanning/template/TaskPlannerDayTemplate.ts';
import {Time} from '@/utils/Time.ts';

const {fetchAll, fetchSelectOptions} = useTaskPlannerDayTemplateTaskCrud()

const props = defineProps<{
	title: string
	calendar?: Calendar,
}>()

const templates = ref<TaskPlannerDayTemplate[]>([] as TaskPlannerDayTemplate[])
const selectedTemplate = ref<TaskPlannerDayTemplate | null>(null)

onMounted(async () => {
	templates.value = await fetchAll()
})

const emit = defineEmits<{
	openDetails: [],
	useTemplate: [template: TaskPlannerDayTemplate]
}>()
</script>

<style scoped>
.detail-chip {
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 0.875rem;
}

.notes-chip {
	flex-basis: 100%;
}

@media (max-width: 1920px) {
	.detailPanel {
		width: 350px;
	}
}

@media (min-width: 1921px) {
	.detailPanel {
		width: 450px;
	}
}
</style>
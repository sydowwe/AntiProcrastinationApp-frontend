<template>
<VCard class="detail-panel h-100 d-flex flex-column pa-4" elevation="0">
	<!-- Header Section -->
	<div class="d-flex align-center justify-space-between mb-4">
		<h3 class="text-subtitle-1 font-weight-bold ma-0">Day Details</h3>
		<VBtn
			variant="outlined"
			color="secondaryOutline"
			@click="emit('openDetails')"
		>
			<VIcon icon="pen-to-square" size="16" class="mr-2"/>
			Edit
		</VBtn>
	</div>

	<VDivider class="mb-5" opacity="0.3"/>

	<!-- Template Section -->
	<div class="mb-6">
		<div class="d-flex align-center ga-2 mb-4">
			<VIcon icon="layer-group" size="16" class="text-medium-emphasis"/>
			<span class="section-label">Day Template</span>
		</div>

		<VAutocomplete
			v-model="selectedTemplate"
			label="Choose template"
			:items="templates"
			itemTitle="name"
			itemValue="id"
			returnObject
			variant="outlined"
			density="comfortable"
			clearable
			hideDetails
		>
			<template #prepend-inner>
				<VIcon icon="search" size="18" class="text-medium-emphasis"/>
			</template>
		</VAutocomplete>

		<!-- Template Preview Card -->
		<VExpandTransition>
			<SubtleCard v-if="selectedTemplate" color="primary" class="template-preview mt-4">
				<div class="d-flex align-center justify-space-between ga-3 mb-2">
					<div class="text-body-2 font-weight-bold">
						{{ selectedTemplate.name }}
						<VIcon v-if="selectedTemplate.icon" :icon="selectedTemplate.icon"></VIcon>
					</div>
					<DayTypeChip :dayType="selectedTemplate.suggestedForDayType" isTonal></DayTypeChip>
				</div>

				<div class="d-flex align-center ga-2 text-caption text-medium-emphasis" :class="selectedTemplate.tags?.length ? 'mb-3' : 'mb-4'">
					<VIcon icon="clock" size="14"/>
					<span>{{ Time.getString(selectedTemplate.defaultWakeUpTime) }} - {{ Time.getString(selectedTemplate.defaultBedTime) }}</span>
				</div>
				<p v-if="selectedTemplate.description" class="text-caption text-medium-emphasis mb-3 ma-0" style="line-height: 1.5">
					{{ selectedTemplate.description }}
				</p>

				<div v-if="selectedTemplate.tags?.length" class="d-flex flex-wrap ga-1 mb-4">
					<VChip
						v-for="tag in selectedTemplate.tags"
						:key="tag"
						size="x-small"
						variant="outlined"
						rounded="lg"
						style="opacity: 0.8"
					>
						{{ tag }}
					</VChip>
				</div>

				<VBtn color="primary" block @click="useTemplate">
					<VIcon icon="eye" size="16" class="mr-2"/>
					Preview Template
				</VBtn>
			</SubtleCard>
		</VExpandTransition>

		<!-- Applied Template Badge -->
		<div v-if="calendar?.appliedTemplateName && !selectedTemplate" class="applied-badge d-flex align-center ga-2 mt-3 pa-3 rounded-lg text-body-2">
			<VIcon icon="check-circle" size="16" color="success"/>
			<span>Using: <strong>{{ calendar.appliedTemplateName }}</strong></span>
		</div>
	</div>

	<VDivider class="mb-5" opacity="0.1"/>
	<!-- Day Info Section -->
	<div v-if="calendar?.weather || calendar?.label || calendar?.notes || calendar?.holidayName" class="d-flex flex-column ga-4">
		<div class="d-flex align-center ga-2">
			<VIcon icon="circle-info" size="16" class="text-medium-emphasis"/>
			<span class="section-label">Day Info</span>
		</div>

		<SubtleCard v-if="calendar?.holidayName" title="Holiday name" color="error" :text="calendar.holidayName" icon="gift"></SubtleCard>

		<SubtleCard v-if="calendar?.weather" title="Weather" color="info" :text="calendar.weather" icon="cloud-sun"></SubtleCard>

		<SubtleCard v-if="calendar?.notes" title="Notes" color="warning" :text="calendar.notes" icon="note-sticky"></SubtleCard>
	</div>
</VCard>
</template>

<script setup lang="ts">
import type {Calendar} from '@/dtos/response/activityPlanning/Calendar.ts';
import {useTaskPlannerDayTemplateTaskCrud} from '@/api/ConcretesCrudComposable.ts';
import {onMounted, ref} from 'vue';
import type {TaskPlannerDayTemplate} from '@/dtos/response/activityPlanning/template/TaskPlannerDayTemplate.ts';
import {Time} from '@/utils/Time.ts';
import {useDayPlannerStore} from '@/stores/dayPlanner/dayPlannerStore.ts';
import DayTypeChip from '@/components/dayPlanner/misc/DayTypeChip.vue';
import SubtleCard from '@/components/general/feedback/SubtleCard.vue';

const {fetchAll} = useTaskPlannerDayTemplateTaskCrud()

const store = useDayPlannerStore()

defineProps<{
	title: string
	calendar?: Calendar,
}>()

const templates = ref<TaskPlannerDayTemplate[]>([] as TaskPlannerDayTemplate[])
const selectedTemplate = ref<TaskPlannerDayTemplate | null>(null)

onMounted(async () => {
	templates.value = await fetchAll()
})

function useTemplate() {
	store.templateInPreview = selectedTemplate.value;
	emit('useTemplate', selectedTemplate.value!)
}

const emit = defineEmits<{
	openDetails: [],
	useTemplate: [template: TaskPlannerDayTemplate]
}>()
</script>

<style scoped>
.detail-panel {
	overflow-y: auto;
}

.section-label {
	font-size: 0.75rem;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	color: rgba(var(--v-theme-on-surface), 0.5);
}

.applied-badge {
	background: rgba(var(--v-theme-success), 0.08);
}

/* Responsive */
@media (max-width: 1920px) {
	.detail-panel {
		width: 350px;
	}
}

@media (min-width: 1921px) {
	.detail-panel {
		width: 450px;
	}
}
</style>

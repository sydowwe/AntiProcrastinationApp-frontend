<!-- DayTemplatePicker.vue -->
<template>
	<div>
		<div class="d-flex align-center ga-2 mb-4">
			<VIcon
				icon="layer-group"
				size="16"
				class="text-medium-emphasis"
			/>
			<span class="section-label">Day Template</span>
		</div>

		<!-- Backend Suggestions -->
		<div
			v-if="backendSuggestions.length && !store.isTemplateInPreview"
			class="mb-4"
		>
			<div class="d-flex align-center ga-1 mb-2">
				<VIcon
					icon="wand-magic-sparkles"
					size="14"
					class="text-primary"
				/>
				<span class="section-label text-primary">{{ t('planner.templateSuggestions.suggestedForYou') }}</span>
			</div>
			<div class="d-flex flex-column ga-2">
				<div
					v-for="s in backendSuggestions"
					:key="s.template.id"
					class="suggestion-item d-flex align-center justify-space-between pa-2 rounded-lg"
					style="cursor: pointer"
					@click="selectSuggestion(s.template)"
				>
					<div class="d-flex align-center ga-2 flex-wrap">
						<VIcon
							v-if="s.template.icon"
							:icon="s.template.icon"
							size="16"
							class="text-medium-emphasis"
						/>
						<span class="text-body-2 font-weight-medium">{{ s.template.name }}</span>
						<VChip
							size="x-small"
							variant="tonal"
							color="primaryOutline"
							class="flex-shrink-0"
						>
							{{ t('planner.templateSuggestions.usedOn', { label: s.patternLabel }) }}
						</VChip>
					</div>
					<span class="text-caption text-medium-emphasis flex-shrink-0 ml-2">
						{{ t('planner.templateSuggestions.timesCount', { count: s.occurrenceCount }) }}
					</span>
				</div>
			</div>
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
				<VIcon
					icon="search"
					size="18"
					class="text-medium-emphasis"
				/>
			</template>
		</VAutocomplete>

		<!-- Template Preview Card -->
		<VExpandTransition>
			<SubtleCard
				v-if="selectedTemplate"
				color="primary"
				class="template-preview mt-4"
			>
				<div class="d-flex align-center justify-space-between ga-3 mb-2">
					<div class="text-body-2 font-weight-bold">
						{{ selectedTemplate.name }}
						<VIcon
							v-if="selectedTemplate.icon"
							:icon="selectedTemplate.icon"
						></VIcon>
					</div>
					<DayTypeChip
						:dayType="selectedTemplate.suggestedForDayType"
						isTonal
					></DayTypeChip>
				</div>

				<div
					class="d-flex align-center ga-2 text-caption text-medium-emphasis"
					:class="selectedTemplate.tags?.length ? 'mb-3' : 'mb-4'"
				>
					<VIcon
						icon="clock"
						size="14"
					/>
					<span>
						{{ Time.getString(selectedTemplate.defaultWakeUpTime) }} -
						{{ Time.getString(selectedTemplate.defaultBedTime) }}
					</span>
				</div>
				<p
					v-if="selectedTemplate.description"
					class="text-caption text-medium-emphasis mb-3 ma-0"
					style="line-height: 1.5"
				>
					{{ selectedTemplate.description }}
				</p>

				<div
					v-if="selectedTemplate.tags?.length"
					class="d-flex flex-wrap ga-1 mb-4"
				>
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

				<VBtn
					v-if="selectedTemplate?.id !== store.templateInPreview?.id"
					color="primary"
					block
					@click="useTemplate"
				>
					<VIcon
						icon="eye"
						size="16"
						class="mr-2"
					/>
					Preview Template
				</VBtn>
				<VChip
					v-else
					color="success"
					variant="tonal"
					block
					class="w-100 justify-center"
				>
					<VIcon
						icon="check"
						size="14"
						class="mr-1"
					/>
					In Preview
				</VChip>
			</SubtleCard>
		</VExpandTransition>

		<!-- Applied Template Badge -->
		<div
			v-if="calendar?.appliedTemplateName && !selectedTemplate"
			class="applied-badge d-flex align-center ga-2 mt-3 pa-3 rounded-lg text-body-2"
		>
			<VIcon
				icon="check-circle"
				size="16"
				color="success"
			/>
			<span>
				Using:
				<strong>{{ calendar.appliedTemplateName }}</strong>
			</span>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { onMounted, ref, watch } from 'vue'
	import { useI18n } from 'vue-i18n'
	import type { Calendar } from '@/dtos/response/activityPlanning/Calendar.ts'
	import type { TaskPlannerDayTemplate } from '@/dtos/response/activityPlanning/template/TaskPlannerDayTemplate.ts'
	import type { TemplateSuggestionResponse } from '@/dtos/response/activityPlanning/template/TemplateSuggestionResponse.ts'
	import { Time } from '@/dtos/dto/Time.ts'
	import { useDayPlannerStore } from '@/stores/dayPlanner/dayPlannerStore.ts'
	import DayTypeChip from '@/components/dayPlanner/misc/DayTypeChip.vue'
	import SubtleCard from '@/components/general/feedback/SubtleCard.vue'
	import { useTaskPlannerDayTemplateTaskCrud } from '@/api/taskPlanner/taskPlannerDayTemplateApi.ts'

	const { calendar } = defineProps<{
		calendar?: Calendar
	}>()

	const emit = defineEmits<{
		useTemplate: []
	}>()

	const { t } = useI18n()
	const store = useDayPlannerStore()
	const { fetchAll, fetchSuggestions } = useTaskPlannerDayTemplateTaskCrud()

	const templates = ref<TaskPlannerDayTemplate[]>([])
	const selectedTemplate = ref<TaskPlannerDayTemplate | null>(null)
	const backendSuggestions = ref<TemplateSuggestionResponse[]>([])

	onMounted(async () => {
		const [allTemplates, suggestions] = await Promise.all([
			fetchAll(),
			calendar?.date ? fetchSuggestions(calendar.date) : Promise.resolve([]),
		])
		templates.value = allTemplates
		backendSuggestions.value = suggestions
		if (store.templateInPreview) {
			selectedTemplate.value = store.templateInPreview
		}
	})

	watch(
		() => store.templateInPreview,
		val => {
			selectedTemplate.value = val
		},
	)

	function selectSuggestion(template: TaskPlannerDayTemplate) {
		selectedTemplate.value = template
	}

	function useTemplate() {
		store.templateInPreview = selectedTemplate.value
		emit('useTemplate')
	}
</script>

<style scoped>
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

	.suggestion-item {
		background: rgba(var(--v-theme-primary), 0.06);
		border: 1px solid rgba(var(--v-theme-primary), 0.15);
		transition: background 0.15s;
	}

	.suggestion-item:hover {
		background: rgba(var(--v-theme-primary), 0.12);
	}
</style>

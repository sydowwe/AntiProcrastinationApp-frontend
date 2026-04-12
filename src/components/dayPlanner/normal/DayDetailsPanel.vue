<template>
	<VCard
		class="detail-panel h-100 d-flex flex-column pa-4"
		elevation="0"
	>
		<!-- Header Section -->
		<div class="d-flex align-center justify-space-between mb-4">
			<h3 class="text-subtitle-1 font-weight-bold ma-0">Day Details</h3>
			<VBtn
				variant="outlined"
				color="secondaryOutline"
				@click="emit('openDetails')"
			>
				<VIcon
					icon="pen-to-square"
					size="16"
					class="mr-2"
				/>
				Edit
			</VBtn>
		</div>

		<div
			v-if="calendar"
			class="d-flex align-center ga-2 mb-4"
		>
			<DayTypeChip
				:dayType="calendar.dayType"
				isTonal
			/>
			<span
				v-if="calendar.label"
				class="mt-1 d-flex align-start"
			>
				<VIcon
					size="16"
					icon="location-dot"
					style="margin-right: 2px"
				></VIcon>
				<span class="text-body-2 text-medium-emphasis font-italic">
					{{ calendar.label }}
				</span>
			</span>
		</div>

		<!-- Overdue Tasks Banner -->
		<VAlert
			v-if="overdueTasks.length && showOverdueBanner"
			v-model="showOverdueBanner"
			density="compact"
			color="warning"
			variant="tonal"
			closable
			class="mb-4"
		>
			<p class="text-caption font-weight-medium mb-2">Not completed yesterday:</p>
			<div class="d-flex flex-wrap ga-2 mb-2">
				<VChip
					v-for="t in overdueTasks"
					:key="t.id"
					size="small"
					color="warning"
					variant="tonal"
					style="cursor: pointer"
					@click="copyOverdueTask(t)"
				>
					{{ t.activity.name }}
				</VChip>
			</div>
			<div class="d-flex align-center ga-2">
				<VSelect
					v-model="overdueConflictResolution"
					:items="overdueConflictResolutionOptions"
					density="compact"
					hideDetails
					style="min-width: 150px; max-width: 150px"
				/>
				<VBtn
					size="small"
					variant="tonal"
					color="warning"
					@click="copyOverdueTasks"
				>
					Copy all
				</VBtn>
			</div>
		</VAlert>

		<VDivider
			class="mb-5"
			opacity="0.3"
		/>

		<!-- Template Section -->
		<div class="mb-6">
			<div class="d-flex align-center ga-2 mb-4">
				<VIcon
					icon="layer-group"
					size="16"
					class="text-medium-emphasis"
				/>
				<span class="section-label">Day Template</span>
			</div>

			<div
				v-if="suggestions.length"
				class="d-flex align-center flex-wrap ga-2 mb-3"
			>
				<span class="section-label mr-1">Suggested:</span>
				<VChip
					v-for="t in suggestions"
					:key="t.id"
					size="small"
					color="primary"
					variant="elevated"
					style="cursor: pointer; border-radius: 4px"
					@click="selectSuggestion(t)"
				>
					<VIcon
						v-if="t.icon"
						:icon="t.icon"
						size="12"
						class="mr-1"
					/>
					{{ t.name }}
				</VChip>
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

		<VDivider
			class="mb-5"
			opacity="0.1"
		/>
		<!-- Day Info Section -->
		<div
			v-if="calendar?.weather || calendar?.label || calendar?.notes || calendar?.holidayName"
			class="d-flex flex-column ga-4"
		>
			<div class="d-flex align-center ga-2">
				<VIcon
					icon="circle-info"
					size="16"
					class="text-medium-emphasis"
				/>
				<span class="section-label">Day Info</span>
			</div>

			<SubtleCard
				v-if="calendar?.holidayName"
				title="Holiday name"
				color="error"
				:text="calendar.holidayName"
				icon="gift"
			></SubtleCard>

			<SubtleCard
				v-if="calendar?.weather"
				title="Weather"
				color="info"
				:text="calendar.weather"
				icon="cloud-sun"
			></SubtleCard>

			<SubtleCard
				v-if="calendar?.notes"
				title="Notes"
				color="warning"
				:text="calendar.notes"
				icon="note-sticky"
			></SubtleCard>
		</div>
	</VCard>
</template>

<script setup lang="ts">
	import type { Calendar } from '@/dtos/response/activityPlanning/Calendar.ts'
	import { useTaskPlannerDayTemplateTaskCrud } from '@/api/taskPlanner/taskPlannerDayTemplateApi.ts'
	import { computed, onMounted, ref, watch } from 'vue'
	import type { TaskPlannerDayTemplate } from '@/dtos/response/activityPlanning/template/TaskPlannerDayTemplate.ts'
	import { Time } from '@/dtos/dto/Time.ts'
	import { useDayPlannerStore } from '@/stores/dayPlanner/dayPlannerStore.ts'
	import DayTypeChip from '@/components/dayPlanner/misc/DayTypeChip.vue'
	import SubtleCard from '@/components/general/feedback/SubtleCard.vue'
	import { useTemplateSuggestion } from '@/composables/dayPlanner/useTemplateSuggestion.ts'
	import { useTaskPlannerCrud } from '@/api/taskPlanner/plannerTaskApi.ts'
	import { useCalendarQuery } from '@/api/calendarApi.ts'
	import { useDateTime } from '@/utils/DateTimeHelper.ts'
	import { ApplyTemplateConflictResolution } from '@/dtos/enum/ApplyTemplateConflictResolution.ts'
	import { getEnumSelectOptions } from '@/composables/general/EnumComposable.ts'
	import { PlannerTaskRequest } from '@/dtos/request/activityPlanning/PlannerTaskRequest.ts'
	import { PlannerTask } from '@/dtos/response/activityPlanning/PlannerTask.ts'
	import { PlannerTaskFilter } from '@/dtos/request/activityPlanning/PlannerTaskFilter.ts'
	import { useSnackbar } from '@/composables/general/SnackbarComposable.ts'

	const { title, calendar } = defineProps<{
		title: string
		calendar?: Calendar
	}>()

	const emit = defineEmits<{
		openDetails: []
		useTemplate: [template: TaskPlannerDayTemplate]
	}>()

	const { fetchAll } = useTaskPlannerDayTemplateTaskCrud()
	const { getSuggestions } = useTemplateSuggestion()
	const { createWithResponse, batchDelete, fetchFiltered } = useTaskPlannerCrud()
	const { fetchByDate: fetchCalendarByDate } = useCalendarQuery()
	const { formatToUsString, usStringToUrlString } = useDateTime()
	const { showSuccessSnackbar } = useSnackbar()

	const store = useDayPlannerStore()

	const templates = ref<TaskPlannerDayTemplate[]>([] as TaskPlannerDayTemplate[])
	const selectedTemplate = ref<TaskPlannerDayTemplate | null>(null)
	const overdueTasks = ref<PlannerTask[]>([])
	const showOverdueBanner = ref(true)
	const overdueConflictResolution = ref(ApplyTemplateConflictResolution.Ignore)
	const overdueConflictResolutionOptions = getEnumSelectOptions(ApplyTemplateConflictResolution, 'planner')

	const suggestions = computed(() => {
		if (!calendar || !templates.value.length || store.isTemplateInPreview) return []
		return getSuggestions(templates.value, calendar)
	})

	watch(
		() => calendar?.id,
		async newId => {
			showOverdueBanner.value = true
			overdueTasks.value = []
			if (!newId) return
			const today = new Date()
			const isToday =
				store.viewedDate.getFullYear() === today.getFullYear() &&
				store.viewedDate.getMonth() === today.getMonth() &&
				store.viewedDate.getDate() === today.getDate()
			if (!isToday) return
			try {
				const yesterday = new Date(store.viewedDate)
				yesterday.setDate(yesterday.getDate() - 1)
				const prevCalendar = await fetchCalendarByDate(usStringToUrlString(formatToUsString(yesterday)))
				const prevTasks = await fetchFiltered(
					new PlannerTaskFilter(prevCalendar.id, prevCalendar.wakeUpTime, prevCalendar.bedTime),
				)
				overdueTasks.value = prevTasks.filter(t => !t.isDone && !t.isBackground)
			} catch {
				overdueTasks.value = []
			}
		},
		{ immediate: true },
	)

	function getOverlappingTasks(task: PlannerTask): PlannerTask[] {
		return store.tasks.filter(
			t =>
				t.id > 0 &&
				!t.isBackground &&
				t.startTime.getInMinutes < task.endTime.getInMinutes &&
				t.endTime.getInMinutes > task.startTime.getInMinutes,
		) as PlannerTask[]
	}

	async function copyOverdueTask(task: PlannerTask) {
		const resolution = overdueConflictResolution.value
		const overlapping = getOverlappingTasks(task)
		if (overlapping.length > 0) {
			if (resolution === ApplyTemplateConflictResolution.MergeIgnore) return
			if (
				resolution === ApplyTemplateConflictResolution.Overwrite ||
				resolution === ApplyTemplateConflictResolution.MergeOverwrite
			) {
				await batchDelete(overlapping.map(t => t.id))
				store.tasks = store.tasks.filter(t => !overlapping.some(o => o.id === t.id))
			}
		}
		const request = PlannerTaskRequest.fromEntity(task)
		request.calendarId = calendar?.id
		const created = await createWithResponse(request)
		if (created.isBackground) {
			store.updateIsDuringBackgroundFlags(created)
		} else {
			created.isDuringBackgroundTask = store.checkOverlapsBackground(created)
		}
		store.setGridPositionFromSpan(created)
		store.tasks.push(created)
		overdueTasks.value = overdueTasks.value.filter(t => t.id !== task.id)
		if (overdueTasks.value.length === 0) showOverdueBanner.value = false
	}

	async function copyOverdueTasks() {
		for (const task of [...overdueTasks.value]) {
			await copyOverdueTask(task)
		}
		showSuccessSnackbar('Tasks carried over')
	}

	onMounted(async () => {
		templates.value = await fetchAll()
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
		emit('useTemplate', selectedTemplate.value!)
	}
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

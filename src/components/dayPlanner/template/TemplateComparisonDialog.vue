<template>
<MyDialog
	v-model="dialog"
	title="Compare Templates"
	maxWidth="1000px"
	:showConfirmBtn="false"
>
	<div v-if="loading" class="d-flex justify-center pa-8">
		<VProgressCircular indeterminate color="primary" />
	</div>
	<div v-else class="d-flex ga-4">
		<div v-for="(side, index) in sides" :key="index" class="flex-fill" style="min-width: 0">
			<VCard variant="outlined" class="pa-4">
				<!-- Template header -->
				<div class="d-flex align-center ga-2 mb-2">
					<VIcon v-if="side.template?.icon">{{ side.template.icon }}</VIcon>
					<span class="text-h6">{{ side.template?.name }}</span>
				</div>

				<!-- Metadata -->
				<div class="d-flex flex-wrap ga-2 mb-3">
					<DayTypeChip v-if="side.template?.suggestedForDayType" :dayType="side.template.suggestedForDayType" isTonal />
					<VChip v-for="tag in side.template?.tags" :key="tag" size="small">{{ tag }}</VChip>
				</div>

				<div class="text-caption text-medium-emphasis mb-1">
					{{ side.template?.defaultWakeUpTime?.hours }}:{{ String(side.template?.defaultWakeUpTime?.minutes ?? 0).padStart(2, '0') }}
					-
					{{ side.template?.defaultBedTime?.hours }}:{{ String(side.template?.defaultBedTime?.minutes ?? 0).padStart(2, '0') }}
					· {{ side.tasks.length }} tasks
				</div>

				<VDivider class="my-3" />

				<!-- Vertical timeline -->
				<div class="vertical-timeline">
					<div
						v-for="task in side.tasks"
						:key="task.id"
						class="timeline-task"
						:class="{ 'timeline-task-bg': task.isBackground }"
						:style="{
							top: `${getVerticalPosition(task, side.template!).top}%`,
							height: `${getVerticalPosition(task, side.template!).height}%`,
							backgroundColor: task.color || '#5c2caa',
						}"
					>
						<span class="timeline-task-label">
							{{ formatTime(task.startTime) }} {{ task.activity?.name }}
						</span>
					</div>
				</div>
			</VCard>
		</div>
	</div>
</MyDialog>
</template>

<script setup lang="ts">
import {ref, watch} from 'vue'
import MyDialog from '@/components/dialogs/MyDialog.vue'
import DayTypeChip from '@/components/dayPlanner/misc/DayTypeChip.vue'
import {useTaskPlannerDayTemplateTaskCrud} from '@/api/taskPlanner/taskPlannerDayTemplateApi.ts'
import {useTemplatePlannerTaskCrud} from '@/api/taskPlanner/templatePlannerTaskApi.ts'
import {TemplatePlannerTaskFilter} from '@/dtos/request/activityPlanning/template/TemplatePlannerTaskFilter.ts'
import type {TaskPlannerDayTemplate} from '@/dtos/response/activityPlanning/template/TaskPlannerDayTemplate.ts'
import type {TemplatePlannerTask} from '@/dtos/response/activityPlanning/template/TemplatePlannerTask.ts'
import type {Time} from '@/dtos/dto/Time.ts'

const props = defineProps<{
	templateIds: number[]
}>()

const dialog = defineModel<boolean>({required: true})

const {fetchById} = useTaskPlannerDayTemplateTaskCrud()
const {fetchFiltered} = useTemplatePlannerTaskCrud()

const loading = ref(false)
const sides = ref<{template: TaskPlannerDayTemplate | null, tasks: TemplatePlannerTask[]}[]>([
	{template: null, tasks: []},
	{template: null, tasks: []},
])

watch(dialog, async (open) => {
	if (!open || props.templateIds.length < 2) return
	loading.value = true
	try {
		const [t1, t2] = await Promise.all([
			fetchById(props.templateIds[0]),
			fetchById(props.templateIds[1]),
		])
		const [tasks1, tasks2] = await Promise.all([
			fetchFiltered(new TemplatePlannerTaskFilter(t1.id, t1.defaultWakeUpTime, t1.defaultBedTime)),
			fetchFiltered(new TemplatePlannerTaskFilter(t2.id, t2.defaultWakeUpTime, t2.defaultBedTime)),
		])
		sides.value = [
			{template: t1, tasks: tasks1},
			{template: t2, tasks: tasks2},
		]
	} finally {
		loading.value = false
	}
})

function getVerticalPosition(task: TemplatePlannerTask, template: TaskPlannerDayTemplate) {
	const start = template.defaultWakeUpTime.getInMinutes
	const end = template.defaultBedTime.getInMinutes
	const total = end > start ? end - start : end + 1440 - start

	const taskStart = task.startTime.getInMinutes
	const taskEnd = task.endTime.getInMinutes
	const offset = (taskStart - start + 1440) % 1440
	const duration = taskEnd > taskStart ? taskEnd - taskStart : taskEnd + 1440 - taskStart

	return {
		top: (offset / total) * 100,
		height: Math.max((duration / total) * 100, 2),
	}
}

function formatTime(time: Time) {
	return `${time.hours}:${String(time.minutes).padStart(2, '0')}`
}
</script>

<style scoped>
.vertical-timeline {
	position: relative;
	height: 400px;
	background: rgba(var(--v-theme-on-surface), 0.04);
	border-radius: 8px;
	overflow: hidden;
}

.timeline-task {
	position: absolute;
	left: 4px;
	right: 4px;
	border-radius: 4px;
	padding: 2px 6px;
	overflow: hidden;
	min-height: 8px;
}

.timeline-task-bg {
	opacity: 0.3;
	left: 0;
	right: 0;
}

.timeline-task-label {
	font-size: 0.7rem;
	color: white;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	display: block;
	line-height: 1.3;
}
</style>

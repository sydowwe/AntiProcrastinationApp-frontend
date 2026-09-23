<template>
	<MyDialog
		v-model="dialog"
		:persistent="false"
		:title="$t('planner.template.compareTemplatesTitle')"
		maxWidth="1000px"
		:hasConfirmBtn="false"
	>
		<div
			v-if="loading"
			class="d-flex justify-center pa-8"
		>
			<VProgressCircular
				indeterminate
				color="primary"
			/>
		</div>
		<div
			v-else-if="sides.every(side => side.template)"
			class="d-flex ga-4"
		>
			<div
				v-for="(side, index) in sides"
				:key="index"
				class="flex-fill"
				style="min-width: 0"
			>
				<VCard
					variant="outlined"
					class="pa-4"
				>
					<!-- Template header -->
					<div class="d-flex align-center ga-2 mb-2">
						<VIcon v-if="side.template?.icon">{{ side.template.icon }}</VIcon>
						<span class="text-h6">{{ side.template?.name }}</span>
					</div>

					<!-- Metadata -->
					<div class="d-flex flex-wrap ga-2 mb-3">
						<DayTypeChip
							v-if="side.template?.suggestedForDayType"
							:dayType="side.template.suggestedForDayType"
							isTonal
						/>
						<VChip
							v-for="tag in side.template?.tags"
							:key="tag"
							size="small"
						>
							{{ tag }}
						</VChip>
					</div>

					<div class="text-caption text-medium-emphasis mb-1">
						{{ side.template?.defaultWakeUpTime?.hours }}:{{
							String(side.template?.defaultWakeUpTime?.minutes ?? 0).padStart(2, '0')
						}}
						-
						{{ side.template?.defaultBedTime?.hours }}:{{
							String(side.template?.defaultBedTime?.minutes ?? 0).padStart(2, '0')
						}}
						· {{ $t('planner.template.tasksCount', { count: side.tasks.length }, side.tasks.length) }}
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
	import { ref, watch } from 'vue'
	import MyDialog from '@/_common/component/dialog/MyDialog.vue'
	import DayTypeChip from '@/core/dayPlanner/component/misc/DayTypeChip.vue'
	import { useTaskPlannerDayTemplateTaskCrud } from '@/core/dayPlanner/api/taskPlannerDayTemplateApi.ts'
	import { useTemplatePlannerTaskCrud } from '@/core/dayPlanner/api/templatePlannerTaskApi.ts'
	import { TemplatePlannerTaskFilter } from '@/core/dayPlanner/dto/request/template/TemplatePlannerTaskFilter.ts'
	import type { TaskPlannerDayTemplate } from '@/core/dayPlanner/dto/response/template/TaskPlannerDayTemplate.ts'
	import type { TemplatePlannerTask } from '@/core/dayPlanner/dto/response/template/TemplatePlannerTask.ts'
	import type { Time } from '@/_common/dto/dto/Time.ts'

	const props = defineProps<{
		templateIds: number[]
	}>()

	const dialog = defineModel<boolean>({ required: true })

	const { fetchById } = useTaskPlannerDayTemplateTaskCrud()
	const { fetchFiltered } = useTemplatePlannerTaskCrud()

	const loading = ref(false)
	const sides = ref<{ template: TaskPlannerDayTemplate | null; tasks: TemplatePlannerTask[] }[]>(emptySides())

	function emptySides() {
		return [
			{ template: null, tasks: [] },
			{ template: null, tasks: [] },
		]
	}

	// Both fan-outs come from one api instance each, and both helpers abort their previous in-flight
	// call unless keyed, so every call carries its template id as `requestKey`. Unkeyed, the first of
	// each pair was cancelled and the dialog rendered empty.
	watch(dialog, async open => {
		if (!open || props.templateIds.length < 2) return
		loading.value = true
		// Clear the previous open's pair so a failed load reads as nothing loaded, not as stale data.
		sides.value = emptySides()
		try {
			const [t1, t2] = await Promise.all(
				props.templateIds.slice(0, 2).map(id => fetchById(id, undefined, { requestKey: id })),
			)
			const [tasks1, tasks2] = await Promise.all(
				[t1, t2].map(t => {
					const filter = new TemplatePlannerTaskFilter(t.id, t.defaultWakeUpTime, t.defaultBedTime)
					return fetchFiltered(filter, undefined, { requestKey: t.id })
				}),
			)
			sides.value = [
				{ template: t1, tasks: tasks1 },
				{ template: t2, tasks: tasks2 },
			]
		} catch {
			// The interceptor has already shown the error toast; the dialog stays on its empty pair.
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

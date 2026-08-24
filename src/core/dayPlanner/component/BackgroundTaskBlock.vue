<template>
	<VSheet
		:color="backgroundColorComp"
		:style="style"
		:data-task-id="task.id"
		class="base-task-block background-task-block"
		:class="[{ 'past-task': isPast }]"
	>
		<!-- Sideways text with a colour-coded importance icon: legible on screen, meaningless to a
		     screen reader, which cannot tell this apart from a normal block. The visible label is
		     hidden from the accessibility tree and replaced by the sentence below. -->
		<VSheet
			class="background-task-label"
			:color="backgroundColorComp"
			aria-hidden="true"
		>
			{{ task.activity.name }}
			<VIcon
				v-if="!!task.importance"
				class="mb-1 mr-1"
				:icon="task.importance?.icon ?? undefined"
				:color="task.importance?.color"
				:size="20"
				style="transform: rotate(-90deg)"
			></VIcon>
		</VSheet>
		<span class="d-sr-only">{{ accessibleLabel }}</span>
	</VSheet>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import { useI18n } from 'vue-i18n'
	import type { IBasePlannerTask } from '@/core/dayPlanner/dto/response/IBasePlannerTask.ts'
	import type { IBasePlannerTaskRequest } from '@/core/dayPlanner/dto/request/IBasePlannerTaskRequest.ts'
	import { useColor } from '@/_common/composable/general/useColor.ts'
	import { Time } from '@/_common/dto/dto/Time.ts'

	const { task, isPast, marginLeft } = defineProps<{
		task: IBasePlannerTask<IBasePlannerTaskRequest>
		isPast?: boolean
		marginLeft?: string
	}>()

	const { getBgColor } = useColor()
	const { t } = useI18n()

	const backgroundColorComp = computed(() => getBgColor(task.activity?.role?.color) || '#4287f5')

	const accessibleLabel = computed(() => {
		const parts = [
			t('planner.a11y.backgroundTaskLabel', {
				name: task.activity.name,
				start: Time.getString(task.startTime),
				end: Time.getString(task.endTime),
			}),
		]
		if (task.importance?.text) parts.push(t('planner.a11y.importancePart', { importance: task.importance.text }))
		if (task.location) parts.push(t('planner.a11y.locationPart', { location: task.location }))
		return parts.join(', ')
	})

	const style = computed(() => {
		const span = Math.max(1, (task.gridRowEnd || 1) - (task.gridRowStart || 1))
		return {
			marginLeft: marginLeft ?? `${task.isDuringBackgroundTask ? 36 : 0}px`,
			gridRow: `${task.gridRowStart} / span ${span}`,
		}
	})
</script>

<style scoped>
	.base-task-block {
		box-sizing: border-box !important;
	}

	.background-task-block {
		position: absolute;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		transition: all 0.2s ease;
		left: 0;
		top: 2px;
		bottom: 0;
		z-index: 5;
		width: 36px;
		cursor: pointer;
	}

	.background-task-block::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: repeating-linear-gradient(0deg, transparent 10px, rgba(255, 255, 255, 0.4) 14px);
		pointer-events: none;
		z-index: 1;
		opacity: 0.9;
		box-sizing: border-box;
	}

	.background-task-label {
		color: white;
		position: sticky;
		z-index: 20;
		opacity: 100%;
		top: 46%;
		writing-mode: sideways-lr;
		padding: 8px 4px;
		width: 100%;
		border-radius: 4px;
		border: 2px double rgba(255, 255, 255, 0.5);
		font-size: 0.9rem;
		font-weight: 600;
	}
</style>

<template>
<BaseEventBlock
	:event
	@resizeStart="emit('resizeStart', $event)"
	@openEditDialog="store.openEditDialog"
	@toggleSelection="store.toggleEventSelection($event)"
	@toggleIsDone="handleToggleIsDone($event)"
	@deleteSelected="handleDeleteSelected"
	@toggleIsDoneSelected="handleToggleIsDoneSelected"
>
	<!-- Use default time slot (already displays time strings correctly) -->

	<!-- Override badges slot to show template-specific fields -->
	<template #badges="{ event: e }">
		<VChip
			v-if="event.priority"
			size="x-small"
			variant="flat"
			:color="getPriorityColor(event.priority)"
			class="event-chip"
		>
			{{ event.priority.text }}
		</VChip>

		<VChip
			v-if="event.isOptional"
			size="x-small"
			variant="outlined"
			class="event-chip"
		>
			Optional
		</VChip>

		<VChip
			v-if="event.location"
			size="x-small"
			variant="flat"
			prependIcon="map-marker"
			class="event-chip"
		>
			{{ event.location }}
		</VChip>

		<!-- Also show category if exists -->
		<VChip
			v-if="event.activity.category"
			size="x-small"
			variant="flat"
			:prependIcon="event.activity.category.icon ?? undefined"
			:color="event.activity.category.color ?? 'white'"
			class="event-chip"
		>
			{{ event.activity.category.name }}
		</VChip>
	</template>
</BaseEventBlock>
</template>

<script setup lang="ts">
import {inject} from 'vue'
import {useTemplateDayPlannerStore} from '@/stores/dayPlanner/templateDayPlannerStore.ts';
import type {TemplatePlannerTask} from '@/dtos/response/activityPlanning/template/TemplatePlannerTask.ts';
import type {TaskPriority} from '@/dtos/response/activityPlanning/TaskPriority.ts';
import BaseEventBlock from '@/components/dayPlanner/BaseEventBlock.vue';

// Inject the store from parent DayPlanner component
const store = inject<ReturnType<typeof useTemplateDayPlannerStore>>('plannerStore')!

const {event} = defineProps<{
	event: TemplatePlannerTask
}>()

function getPriorityColor(priority: TaskPriority): string {
	// You can customize priority colors based on your TaskPriority model
	const priorityColors: Record<string, string> = {
		'High': '#e74c3c',
		'Medium': '#ff9f1a',
		'Low': '#4287f5'
	}
	return priorityColors[priority.text] || '#999'
}

function handleToggleIsDone(eventId: number): void {
	const taskEvent = store.events.find(e => e.id === eventId)
	if (!taskEvent) return

	// Toggle isDone locally first for immediate feedback
	taskEvent.isDone = !taskEvent.isDone

	// Call API to update
	store.updateTaskIsDone(eventId, taskEvent.isDone)
		.catch((error) => {
			// Revert on error
			taskEvent.isDone = !taskEvent.isDone
		})
}

function handleDeleteSelected(): void {
	// Open delete dialog for selected events
	store.openDeleteDialog()
}

function handleToggleIsDoneSelected(): void {
	// Toggle isDone for all selected events
	const selectedEventIds = Array.from(store.selectedEventIds)

	selectedEventIds.forEach(eventId => {
		const taskEvent = store.events.find(e => e.id === eventId)
		if (!taskEvent) return

		const newIsDone = !taskEvent.isDone
		taskEvent.isDone = newIsDone

		store.updateTaskIsDone(eventId, newIsDone)
			.catch((error) => {
				taskEvent.isDone = !newIsDone
			})
	})
}

const emit = defineEmits<{
	(e: 'resizeStart', payload: { eventId: number; direction: 'top' | 'bottom'; $event: PointerEvent }): void
}>()
</script>
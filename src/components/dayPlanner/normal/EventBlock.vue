<template>
<BaseEventBlock
	:class="classes"
	:event
	:backgroundColor="event.color"
	:isPast
	@resizeStart="emit('resizeStart', $event)"
	@keydown.space.prevent="handleToggleIsDoneSelected"
>
	<template #checkbox>
		<VCheckbox
			v-if="event.id >= 0"
			:disabled="store.isTemplateInPreview"
			v-model="event.isDone"
			@update:modelValue="emit('toggleIsDone', event.id)"
			class="event-checkbox"
			density="default"
			hideDetails
			@click.stop
		/>
	</template>
	<!-- Override badges slot to show priority, optional, location, and category -->
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
import {computed, inject} from 'vue'
import {useMoment} from '@/scripts/momentHelper.ts';
import {useDayPlannerStore} from '@/stores/dayPlanner/dayPlannerStore.ts';
import {useCurrentTime} from '@/composables/general/useCurrentTime.ts';
import type {PlannerTask} from '@/dtos/response/activityPlanning/PlannerTask.ts';
import type {TaskPriority} from '@/dtos/response/activityPlanning/TaskPriority.ts';
import BaseEventBlock from '../BaseEventBlock.vue';

const {formatToTime24H} = useMoment()
const {currentTime} = useCurrentTime()

// Inject the store from parent DayPlanner component
const store = inject<ReturnType<typeof useDayPlannerStore>>('plannerStore')!

const {event} = defineProps<{
	event: PlannerTask
}>()


const isPast = computed(() => {
	const dateTime = new Date();
	dateTime.setHours(event.endTime.hours, event.endTime.minutes);
	return dateTime < currentTime.value
})

const classes = computed(() => {
	return {
		'pl-2': event.id < 0 && !event.isBackground,
		'templatePreview': event.id < 0
	}
})

function getPriorityColor(priority: TaskPriority): string {
	// You can customize priority colors based on your TaskPriority model
	const priorityColors: Record<string, string> = {
		'High': '#e74c3c',
		'Medium': '#ff9f1a',
		'Low': '#4287f5'
	}
	return priorityColors[priority.text] || '#999'
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
	resizeStart: [payload: { eventId: number; direction: 'top' | 'bottom'; $event: PointerEvent }],
	toggleIsDone: [taskId: number]
}>()
</script>
<style>
.event-checkbox {
	z-index: 15;
	padding: 10px 0 10px 5px;
	margin-right: -5px;
}

.event-block.done-task {
	opacity: 0.65;
	filter: saturate(0.5);
}

.event-block.done-task .event-title {
	text-decoration: line-through;
	opacity: 0.7;
}

.event-block.done-task .event-time {
	opacity: 0.6;
}

.base-event-block.templatePreview {
	z-index: 50;
	background-image: repeating-linear-gradient(
		50deg,
		transparent,
		transparent 10px,
		rgba(0, 0, 0, 0.07) 10px,
		rgba(0, 0, 0, 0.07) 20px
	) !important;
	border: 2px solid rgba(var(--v-theme-secondary), 0.7);
}
</style>
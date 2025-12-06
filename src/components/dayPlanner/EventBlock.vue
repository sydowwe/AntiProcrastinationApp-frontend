<template>
<BaseEventBlock
	:event="eventWithTimeStrings"
	:focusedEventId="store.focusedEventId"
	:draggingEventId="store.draggingEventId"
	:resizingEventId="store.resizingEventId"
	:dragConflict="store.dragConflict"
	:isDraggingAny="store.isDraggingAny"
	:isResizingAny="store.isResizingAny"
	:backgroundColor="event.color"
	:isPast="isPast"
	@resizeStart="emit('resizeStart', $event)"
	@focusEvent="store.handleFocusEvent($event as number)"
	@openEditDialog="store.openEditDialog"
>
	<!-- Override time slot to format Date objects -->
	<template #time="{ event: e }">
		<div class="event-time">{{ formattedTime }}</div>
	</template>

	<!-- Keep default badges slot (shows category) -->
</BaseEventBlock>
</template>

<script setup lang="ts">
import {computed} from 'vue'
import {useMoment} from '@/scripts/momentHelper.ts';
import {useDayPlannerStore} from '@/stores/dayPlanner/dayPlannerStore.ts';
import {useCurrentTime} from '@/composables/general/useCurrentTime.ts';
import type {PlannerTask} from '@/dtos/response/activityPlanning/PlannerTask.ts';
import BaseEventBlock from './BaseEventBlock.vue';
import type {BasePlannerTaskResponse} from '@/dtos/response/activityPlanning/IBasePlannerTask.ts';

const {formatToTime24H} = useMoment()
const {currentTime} = useCurrentTime()
const store = useDayPlannerStore()

const {event} = defineProps<{
	event: PlannerTask
}>()

const isPast = computed(() => event.end < currentTime.value)

const formattedTime = computed(() => {
	return `${formatToTime24H(event.start)} - ${formatToTime24H(event.end)}`
})

// Convert PlannerTask to BasePlannerTaskResponse format for BaseEventBlock
const eventWithTimeStrings = computed((): BasePlannerTaskResponse => {
	return {
		id: event.id.toString(),
		startTime: formatToTime24H(event.start),
		endTime: formatToTime24H(event.end),
		isBackground: event.isBackground,
		isOptional: false, // PlannerTask doesn't have this field
		activity: event.activity,
		gridRowStart: event.gridRowStart,
		gridRowEnd: event.gridRowEnd,
		isDuringBackgroundEvent: event.isDuringBackgroundEvent
	} as BasePlannerTaskResponse
})

const emit = defineEmits<{
	(e: 'resizeStart', payload: { eventId: number; direction: 'top' | 'bottom'; $event: PointerEvent }): void
}>()
</script>
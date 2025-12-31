<template>
<BaseEventBlock
	:event
	:store
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
import BaseEventBlock from '../BaseEventBlock.vue';

const {formatToTime24H} = useMoment()
const {currentTime} = useCurrentTime()
const store = useDayPlannerStore()

const {event} = defineProps<{
	event: PlannerTask
}>()

const isPast = computed(() => {
	const dateTime = new Date();
	dateTime.setHours(event.endTime.hours, event.endTime.minutes);
	return dateTime < currentTime.value
})

const formattedTime = computed(() => {
	return `${event.startTime.getString()} - ${event.endTime.getString()}`
})


const emit = defineEmits<{
	(e: 'resizeStart', payload: { eventId: number; direction: 'top' | 'bottom'; $event: PointerEvent }): void
}>()
</script>
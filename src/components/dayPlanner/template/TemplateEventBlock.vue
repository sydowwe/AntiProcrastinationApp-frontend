<template>
<BaseEventBlock
	:event
	@resizeStart="emit('resizeStart', $event)"
>
	<!-- Use default time slot (already displays time strings correctly) -->

	<!-- Override badges slot to show template-specific fields -->
	<template #badges="{ event: e }">
		<VChip
			v-if="event.importance"
			size="x-small"
			variant="flat"
			:color="event.importance.color"
			class="event-chip"
		>
			{{ event.importance.text }}
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
import BaseEventBlock from '@/components/dayPlanner/BaseEventBlock.vue';

const store = inject<ReturnType<typeof useTemplateDayPlannerStore>>('plannerStore')!

const {event} = defineProps<{
	event: TemplatePlannerTask
}>()


const emit = defineEmits<{
	(e: 'resizeStart', payload: { eventId: number; direction: 'top' | 'bottom'; $event: PointerEvent }): void
}>()
</script>
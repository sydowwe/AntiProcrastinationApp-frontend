<!-- DayPlanner.vue - Unified day planner component for both regular and template views -->
<template>
<div>
	<VCard class="mx-auto w-100 w-lg-66 d-flex flex-column">
		<!-- Header slot - each view provides its own header -->
		<slot name="header" :store="plannerStore">
			<VCardTitle class="d-flex justify-space-between align-center flex-wrap ga-2">
				<span>{{ title }}</span>

				<TimeRangePicker
					v-model:start="plannerStore.viewStartTime"
					v-model:end="plannerStore.viewEndTime"
				/>
				<div class="d-flex ga-2 align-center flex-wrap">
					<VBtn
						color="secondary"
						@pointerdown.prevent="plannerStore.openEditDialog"
						:class="{ 'is-hidden': !plannerStore.focusedEventId }"
					>
						Edit
					</VBtn>
					<VBtn
						color="secondaryOutline"
						variant="outlined"
						@pointerdown.prevent="plannerStore.openDeleteDialog"
						:class="{ 'is-hidden': !plannerStore.focusedEventId }"
					>
						Delete
					</VBtn>
					<VBtn
						color="primary"
						@click="plannerStore.openCreateDialogEmpty"
						prependIcon="plus"
					>
						{{ addButtonText }}
					</VBtn>
				</div>
			</VCardTitle>
		</slot>

		<VCardText class="flex-fill d-flex flex-column ga-4">
			<div class="calendar-grid flex-fill">

				<!-- Time Column -->
				<TimeColumn/>

				<!-- Events Column with event block slot -->
				<EventsColumn
					:plannerStore="plannerStore"
					:slotIndexToTimeValue="slotIndexToTimeValue"
					@updatedTaskSpan="(payload) => emit('updatedTaskSpan', payload)"
				>
					<template #event-block="{ event, onResizeStart }">
						<!-- Default slot for event blocks - each view provides its own EventBlock component -->
						<slot name="event-block" :event="event" :onResizeStart="onResizeStart">
							<!-- Fallback if no event-block slot provided -->
							<EventBlock
								:event="event"
								@resizeStart="onResizeStart"
							/>
						</slot>
					</template>
				</EventsColumn>
			</div>

			<!-- Legend slot - optional for future use -->
			<slot name="legend">
				<div class="calendar-legend">
					<!-- Add category legend here if needed -->
				</div>
			</slot>
		</VCardText>
	</VCard>

	<!-- Delete Confirmation Dialog -->
	<MyDialog
		title="Delete confirmation"
		:text="deleteConfirmationText"
		v-model="plannerStore.deleteDialog"
		@confirmed="emit('delete')"
		confirmBtnColor="error"
	/>

	<!-- Dialog slot - each view provides its own dialog (EventDialog vs PlannerTaskTemplateDialog) -->
	<slot name="dialog" :store="plannerStore"/>

	<!-- Conflict Snackbar -->
	<VSnackbar
		v-model="plannerStore.conflictSnackbar"
		color="error"
		:timeout="3000"
	>
		{{ conflictMessage }}
		<template v-slot:actions>
			<VBtn
				variant="text"
				@click="plannerStore.conflictSnackbar = false"
			>
				Close
			</VBtn>
		</template>
	</VSnackbar>
</div>
</template>

<script setup lang="ts" generic="TStore extends Record<string, any>">
import {computed} from 'vue'
import MyDialog from '@/components/dialogs/MyDialog.vue'
import TimeColumn from '@/components/dayPlanner/TimeColumn.vue'
import EventsColumn from '@/components/dayPlanner/EventsColumn.vue'
import EventBlock from '@/components/dayPlanner/EventBlock.vue'
import TimeRangePicker from '@/components/general/dateTime/TimeRangePicker.vue'
import type {TemplatePlannerTask} from '@/dtos/response/activityPlanning/template/TemplatePlannerTask.ts';

const props = withDefaults(defineProps<{
	plannerStore: TStore
	slotIndexToTimeValue: (index: number) => Date | string
	title?: string
	addButtonText?: string
	conflictMessage?: string
}>(), {
	title: 'Day Planner',
	addButtonText: 'Add New Event',
	conflictMessage: 'Event conflicts with existing schedule!'
})

const deleteConfirmationText = computed(() => {
	const eventName = props.plannerStore.toDeleteEvent?.activity?.name ?? 'this event'
	return `Are you sure you want to delete ${eventName}?`
})

const emit = defineEmits<{
	(e: 'updatedTaskSpan', payload: { eventId: number; updates: Partial<TemplatePlannerTask> }): void
	(e: 'delete'): void
}>()
</script>

<style scoped>
.calendar-grid {
	background: rgb(var(--v-theme-neutral-100));
	display: grid;
	grid-template-columns: 80px 1fr;
	gap: 0;
	height: 600px;
	overflow-y: auto;
	border: 2px solid #444;
	padding: 10px 0;
}

.calendar-legend {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	padding: 8px;
	background: #f5f5f5;
	border-radius: 4px;
}

/* Scrollbar styling */
.calendar-grid::-webkit-scrollbar {
	width: 8px;
	height: 8px;
}

.calendar-grid::-webkit-scrollbar-track {
	background: #f1f1f1;
}

.calendar-grid::-webkit-scrollbar-thumb {
	background: #888;
	border-radius: 4px;
}

.calendar-grid::-webkit-scrollbar-thumb:hover {
	background: #555;
}

/* Responsive adjustments */
@media (max-width: 600px) {
	.calendar-grid {
		height: 500px;
	}
}
</style>

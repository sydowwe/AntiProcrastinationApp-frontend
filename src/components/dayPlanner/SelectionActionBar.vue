<template>
<!-- Floating Selection Action Bar -->
<Transition name="slide-up">
	<VSheet
		v-if="store.hasSelectedEvents"
		class="selection-action-bar d-flex align-center ga-2 ga-md-3 px-4 py-2"
		elevation="8"
		rounded="lg"
	>
			<span class="text-textMuted d-flex align-center ga-1">
<!--				<VIcon icon="far fa-check-square"></VIcon>-->
				<span class="font-weight-medium selection-count" style="font-size: 1rem; line-height: 1.2rem;">
					{{ store.selectedEventIds.size }} selected
				</span>
			</span>
		<!-- Edit button - only when 1 selected -->
		<VBtn
			v-if="store.selectedEventIds.size === 1"
			variant="outlined"
			color="primaryOutline"
			@click="store.openEditDialog()"
		>
			Edit
		</VBtn>

		<!-- Slot for view-specific actions (e.g., Toggle Done) -->
		<slot name="actions" :store="store"></slot>

		<!-- Delete button -->
		<VBtn
			variant="outlined"
			color="error"
			@click="store.openDeleteDialog()"
		>
			Delete
		</VBtn>

		<!-- Cancel button -->
		<VBtn
			variant="tonal"
			color="secondaryOutline"
			@click="store.clearSelection()"
		>
			Cancel
		</VBtn>
	</VSheet>
</Transition>
</template>

<script setup lang="ts"
        generic="TTask extends IBasePlannerTask<TTaskRequest>, TTaskRequest extends IBasePlannerTaskRequest, TStore extends IBaseDayPlannerStore<TTask, TTaskRequest>">
import type {IBaseDayPlannerStore} from '@/types/IBaseDayPlannerStore.ts'
import type {IBasePlannerTask} from '@/dtos/response/activityPlanning/IBasePlannerTask.ts'
import type {IBasePlannerTaskRequest} from '@/dtos/request/activityPlanning/IBasePlannerTaskRequest.ts'
import {inject} from 'vue';

const store = inject<TStore>('plannerStore')!
</script>

<style scoped>
/* Selection Action Bar */
.selection-action-bar {
	position: sticky;
	bottom: 20px;
	left: 50%;
	transform: translateX(-50%);
	z-index: 50;
	background: rgb(var(--v-theme-surface));
	border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
	max-width: 95%;
	min-width: min-content;
	text-wrap: nowrap;
}

/* Slide-up transition */
.slide-up-enter-active,
.slide-up-leave-active {
	transition: all 0.3s ease;
}

.slide-up-enter-from {
	opacity: 0;
	transform: translateX(-50%) translateY(20px);
}

.slide-up-leave-to {
	opacity: 0;
	transform: translateX(-50%) translateY(20px);
}

/* Responsive adjustments */
@media (max-width: 600px) {
	/* Mobile-friendly floating action bar */
	.selection-action-bar {
		bottom: 10px;
		max-width: 98%;
		padding: 10px 8px !important;
	}

	.selection-action-bar .selection-count {
		font-size: 0.75rem;
		white-space: nowrap;
	}

	/* Make buttons even smaller on mobile */
	.selection-action-bar :deep(.v-btn) {
		font-size: 0.75rem;
		min-width: auto;
		padding: 0 8px;
		height: 28px;
	}
}


</style>

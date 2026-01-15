<template>
<ActionBar :isShown="store.showActionBar" @cancel="store.clearSelection">
		<span class="text-textMuted d-flex align-center ga-1">
<!--				<VIcon icon="far fa-check-square"></VIcon>-->
				<span class="font-weight-medium selection-count" style="font-size: 1rem; line-height: 1.2rem;">
					{{ store.selectedTaskIds.size }} selected
				</span>
			</span>
	<VBtn
		v-if="store.selectedTaskIds.size === 1"
		variant="outlined"
		color="primaryOutline"
		@click="store.openEditDialog"
	>
		Edit
	</VBtn>

	<slot :store="store"></slot>

	<VBtn
		variant="outlined"
		color="error"
		@click="store.openDeleteDialog"
	>
		Delete
	</VBtn>
</ActionBar>
</template>

<script setup lang="ts"
        generic="TTask extends IBasePlannerTask<TTaskRequest>, TTaskRequest extends IBasePlannerTaskRequest, TStore extends IBaseDayPlannerStore<TTask, TTaskRequest>">
import type {IBaseDayPlannerStore} from '@/types/IBaseDayPlannerStore.ts'
import type {IBasePlannerTask} from '@/dtos/response/activityPlanning/IBasePlannerTask.ts'
import type {IBasePlannerTaskRequest} from '@/dtos/request/activityPlanning/IBasePlannerTaskRequest.ts'
import {inject} from 'vue';
import ActionBar from '@/components/general/ActionBar.vue';

const store = inject<TStore>('plannerStore')!
</script>

<style scoped>
@media (max-width: 600px) {
	.action-bar .selection-count {
		font-size: 0.75rem;
		white-space: nowrap;
	}
}
</style>

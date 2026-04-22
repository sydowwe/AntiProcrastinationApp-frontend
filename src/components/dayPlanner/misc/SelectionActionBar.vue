<template>
	<ActionBar
		:isShown="store.showActionBar"
		@cancel="store.clearSelection"
	>
		<!-- Clipboard placement mode -->
		<template v-if="store.pendingClipboard">
			<span
				class="text-textMuted d-flex align-center ga-1 font-weight-medium"
				style="font-size: 0.9rem; line-height: 1.2rem"
			>
				{{ store.pendingClipboard.mode === 'cut' ? 'Cut' : 'Duplicating' }}:
				{{
					store.pendingClipboard.tasks.length === 1
						? (store.pendingClipboard.tasks[0].activity?.name ?? 'task')
						: `${store.pendingClipboard.tasks[0].activity?.name ?? 'task'} +${store.pendingClipboard.tasks.length - 1} more`
				}}
				— click a slot to place
			</span>
		</template>

		<!-- Normal selection mode -->
		<template v-else>
			<span class="text-textMuted d-flex align-center ga-1">
				<span
					class="font-weight-medium selection-count"
					style="font-size: 1rem; line-height: 1.2rem"
				>
					{{ store.selectedTaskIds.size }} selected
				</span>
			</span>
			<VBtn
				variant="outlined"
				color="error"
				@click="store.openDeleteDialog"
			>
				Delete
			</VBtn>
			<VBtn
				v-if="store.selectedTaskIds.size === 1"
				variant="outlined"
				color="primaryOutline"
				@click="store.openEditDialog"
			>
				Edit
			</VBtn>
			<VBtn
				variant="tonal"
				color="secondaryOutline"
				@click="store.startCut"
			>
				Cut
			</VBtn>
			<VBtn
				variant="tonal"
				color="secondaryOutline"
				@click="store.startDuplicate"
			>
				Duplicate
			</VBtn>

			<slot :store="store"></slot>
		</template>
	</ActionBar>
</template>

<script
	setup
	lang="ts"
	generic="
		TTask extends IBasePlannerTask<TTaskRequest>,
		TTaskRequest extends IBasePlannerTaskRequest,
		TStore extends IBaseDayPlannerStore<TTask, TTaskRequest>
	"
>
	import type { IBaseDayPlannerStore } from '@/stores/dayPlanner/IBaseDayPlannerStore.ts'
	import type { IBasePlannerTask } from '@/dtos/response/activityPlanning/IBasePlannerTask.ts'
	import type { IBasePlannerTaskRequest } from '@/dtos/request/activityPlanning/IBasePlannerTaskRequest.ts'
	import { inject } from 'vue'
	import ActionBar from '@/components/general/ActionBar.vue'

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

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
				{{ store.pendingClipboard.mode === 'cut' ? $t('planner.misc.cut') : $t('planner.misc.duplicating') }}:
				{{
					store.pendingClipboard.tasks.length === 1
						? (store.pendingClipboard.tasks[0].activity?.name ?? $t('planner.misc.taskFallback'))
						: `${store.pendingClipboard.tasks[0].activity?.name ?? $t('planner.misc.taskFallback')} ${$t('planner.misc.plusMore', { count: store.pendingClipboard.tasks.length - 1 })}`
				}}
				{{ $t('planner.misc.clickSlotToPlace') }}
			</span>
		</template>

		<!-- Normal selection mode -->
		<template v-else>
			<span class="text-textMuted d-flex align-center ga-1">
				<span
					class="font-weight-medium selection-count"
					style="font-size: 1rem; line-height: 1.2rem"
				>
					{{
						$t(
							'planner.misc.selectedCount',
							{ count: store.selectedTaskIds.size },
							store.selectedTaskIds.size,
						)
					}}
				</span>
			</span>
			<VBtn
				variant="outlined"
				color="error"
				@click="store.openDeleteDialog"
			>
				{{ $t('general.delete') }}
			</VBtn>
			<VBtn
				v-if="store.selectedTaskIds.size === 1"
				variant="outlined"
				color="primaryOutline"
				@click="store.openEditDialog"
			>
				{{ $t('general.edit') }}
			</VBtn>
			<VBtn
				variant="tonal"
				color="secondaryOutline"
				@click="store.startCut"
			>
				{{ $t('planner.misc.cut') }}
			</VBtn>
			<VBtn
				variant="tonal"
				color="secondaryOutline"
				@click="store.startDuplicate"
			>
				{{ $t('planner.template.duplicateAction') }}
			</VBtn>

			<slot :store="store"></slot>
		</template>
	</ActionBar>
</template>

<script setup lang="ts">
	import { PLANNER_STORE_KEY } from '@/core/dayPlanner/store/IBaseDayPlannerStore.ts'
	import { inject } from 'vue'
	import ActionBar from '@/_common/component/ActionBar.vue'
	import { PLANNER_GRID_KEY } from '@/core/dayPlanner/component/DayPlannerTypes.ts'
	import { useActionBarFocusReturn } from '@/core/dayPlanner/composable/useActionBarFocusReturn.ts'

	const store = inject(PLANNER_STORE_KEY)!
	const gridElement = inject(PLANNER_GRID_KEY, undefined)

	// The task block that opened the bar is normally still on screen to go back to. It is not after
	// a delete or a cut, which is exactly when the bar closes — hence the grid as the fallback.
	useActionBarFocusReturn(
		() => store.showActionBar,
		() => gridElement?.value,
	)
</script>

<style scoped>
	@media (max-width: 600px) {
		.action-bar .selection-count {
			font-size: 0.75rem;
			white-space: nowrap;
		}
	}
</style>

<!-- TemplatePlannerHeader.vue -->
<template>
	<VCardTitle class="px-5 pb-0 pt-3 pt-md-4 d-flex justify-space-between align-center flex-wrap ga-2">
		<div class="d-flex align-center ga-3">
			<span class="text-h5">{{ title }}</span>
			<slot name="headerPrepend"></slot>
		</div>

		<div class="d-flex align-center ga-2">
			<TimeRangePicker
				v-model:start="viewStartTime"
				v-model:end="viewEndTime"
				startIcon="sun"
				endIcon="moon"
			/>
			<VBtnToggle
				v-model="timeSlotDurationModel"
				density="compact"
				variant="outlined"
				color="primaryOutline"
				mandatory
			>
				<VBtn
					v-for="option in SNAP_INTERVAL_OPTIONS"
					:key="option"
					:value="option"
					size="small"
				>
					{{ option }}m
				</VBtn>
			</VBtnToggle>
		</div>

		<div class="d-flex ga-2 align-center flex-wrap">
			<VTooltip
				:text="nextUndoDescription ? `Undo: ${nextUndoDescription}` : 'Nothing to undo'"
				location="bottom"
			>
				<template #activator="{ props: tooltipProps }">
					<VBtn
						v-bind="tooltipProps"
						variant="tonal"
						color="secondaryOutline"
						:disabled="!canUndo"
						@click="undo()"
					>
						<VIcon icon="rotate-left" />
						<VBadge
							v-if="stackSize > 0"
							:content="stackSize"
							color="primary"
							floating
						/>
					</VBtn>
				</template>
			</VTooltip>
			<VBtn
				color="primary"
				prependIcon="plus"
				:disabled="!store.canCreate"
				@click="store.openCreateDialog"
			>
				Add New Task
			</VBtn>
		</div>
	</VCardTitle>
</template>

<script setup lang="ts">
	import { computed, inject } from 'vue'
	import TimeRangePicker from '@/components/general/dateTime/TimeRangePicker.vue'
	import type { IBaseDayPlannerStore } from '@/stores/dayPlanner/IBaseDayPlannerStore.ts'
	import { useUndoStack } from '@/composables/general/useUndoStack.ts'

	const { title } = defineProps<{
		title?: string
	}>()

	const SNAP_INTERVAL_OPTIONS = [5, 10, 15, 30]

	const store = inject<IBaseDayPlannerStore<any, any>>('plannerStore')!
	const { undo, canUndo, stackSize, nextUndoDescription } = useUndoStack()

	const viewStartTime = computed({
		get: () => store.viewStartTime,
		set: value => store.$patch({ viewStartTime: value }),
	})
	const viewEndTime = computed({
		get: () => store.viewEndTime,
		set: value => store.$patch({ viewEndTime: value }),
	})
	const timeSlotDurationModel = computed({
		get: () => store.timeSlotDuration,
		set: value => {
			store.$patch({ timeSlotDuration: value })
			store.initializeTaskGridPositions()
		},
	})
</script>

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
				:text="
					nextUndoDescription
						? $t('planner.dialog.undoDescription', { description: nextUndoDescription })
						: $t('planner.dialog.nothingToUndo')
				"
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
				{{ $t('planner.template.addNewTaskAction') }}
			</VBtn>
		</div>
	</VCardTitle>
</template>

<script setup lang="ts">
	import { computed, inject } from 'vue'
	import TimeRangePicker from '@/_common/component/dateTime/TimeRangePicker.vue'
	import { PLANNER_STORE_KEY } from '@/core/dayPlanner/store/IBaseDayPlannerStore.ts'
	import { useUndoStack } from '@/_common/composable/general/useUndoStack.ts'

	const { title } = defineProps<{
		title?: string
	}>()

	const SNAP_INTERVAL_OPTIONS = [5, 10, 15, 30]

	const store = inject(PLANNER_STORE_KEY)!
	const { undo, canUndo, stackSize, nextUndoDescription } = useUndoStack()

	// Written straight onto the store rather than through `$patch` — see the note in DayPlanner.vue.
	const viewStartTime = computed({
		get: () => store.viewStartTime,
		set: value => (store.viewStartTime = value),
	})
	const viewEndTime = computed({
		get: () => store.viewEndTime,
		set: value => (store.viewEndTime = value),
	})
	const timeSlotDurationModel = computed({
		get: () => store.timeSlotDuration,
		set: value => {
			store.timeSlotDuration = value
			store.initializeTaskGridPositions()
		},
	})
</script>

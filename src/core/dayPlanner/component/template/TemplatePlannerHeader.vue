<!-- TemplatePlannerHeader.vue -->
<template>
	<VCardTitle class="px-5 pb-0 pt-3 pt-md-4 d-flex justify-space-between align-center flex-wrap ga-2">
		<div class="d-flex align-center flex-wrap ga-3">
			<!-- The panel's X is otherwise the only writer of `panelOpen` in a compact planner — once
			     closed it stayed closed until a reload (F51). Same control as DayPlannerHeader's. Shown by
			     the planner's own width, not the window's, so each split-view pane has one (F88). -->
			<VIconBtn
				v-if="compact"
				variant="tonal"
				color="secondaryOutline"
				icon="bars"
				:aria-label="panelOpen ? $t('planner.a11y.closePanel') : $t('planner.a11y.openPanel')"
				@click="panelOpen = !panelOpen"
			/>
			<span class="text-h5">{{ title }}</span>
			<slot name="headerPrepend"></slot>
		</div>

		<div class="d-flex align-center flex-wrap ga-2">
			<TimeRangePicker
				v-model:start="viewStartTime"
				v-model:end="viewEndTime"
				startIcon="sun"
				endIcon="moon"
			/>
			<MyBtnToggle
				v-model="timeSlotDurationModel"
				:label="$t('planner.settings.slotSize')"
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
			</MyBtnToggle>
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
						:aria-label="undoLabel"
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
	import MyBtnToggle from '@/_common/component/inputs/MyBtnToggle.vue'
	import TimeRangePicker from '@/_common/component/dateTime/TimeRangePicker.vue'
	import { PLANNER_STORE_KEY } from '@/core/dayPlanner/store/IBaseDayPlannerStore.ts'
	import { useUndoStack } from '@/_common/composable/general/useUndoStack.ts'
	import { useI18n } from 'vue-i18n'
	import { usePlannerCompact } from '@/core/dayPlanner/composable/usePlannerLayout.ts'

	const { title } = defineProps<{
		title?: string
	}>()

	const panelOpen = defineModel<boolean>('panelOpen', { default: true })
	const compact = usePlannerCompact()

	const SNAP_INTERVAL_OPTIONS = [5, 10, 15, 30]

	const store = inject(PLANNER_STORE_KEY)!
	const { undo, canUndo, stackSize, nextUndoDescription } = useUndoStack()
	const i18n = useI18n()

	// The badge is decorative; the count belongs in the name, or the button's accessible name is
	// whatever number the badge happens to show (F56, controls #5/#6).
	const undoLabel = computed(() =>
		stackSize.value > 0
			? i18n.t('planner.a11y.undoCount', { count: stackSize.value })
			: i18n.t('planner.a11y.undo'),
	)

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

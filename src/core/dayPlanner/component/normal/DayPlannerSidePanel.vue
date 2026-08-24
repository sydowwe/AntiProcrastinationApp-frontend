<!-- DayPlannerSidePanel.vue -->
<template>
	<PlannerSidePanelShell
		v-model:panelOpen="panelOpen"
		v-model:activePanel="activePanel"
		:detailsTitle="$t('planner.calendar.dayDetailsTitle')"
		detailsIcon="calendar-day"
	>
		<template #titleActions>
			<VBtn
				v-if="activePanel === 'details'"
				variant="outlined"
				color="secondaryOutline"
				size="small"
				@click="emit('openEditDialog')"
			>
				<VIcon
					icon="pen-to-square"
					size="14"
					class="mr-1"
				/>
				{{ $t('planner.calendar.editAction') }}
			</VBtn>
		</template>

		<template #details>
			<DayDetailsPanel
				:title
				:calendar
				:repeatingTasks="suggestions"
				:addedIds
				@useTemplate="emit('useTemplate')"
				@addRepeatingTask="task => emit('addRepeatingTask', task)"
			/>
		</template>

		<template #routine>
			<RoutineSidePanel @update:selectedItem="item => emit('update:selectedItem', item)" />
		</template>
	</PlannerSidePanelShell>
</template>

<script setup lang="ts">
	import PlannerSidePanelShell from '@/core/dayPlanner/component/PlannerSidePanelShell.vue'
	import DayDetailsPanel from '@/core/dayPlanner/component/normal/DayDetailsPanel.vue'
	import RoutineSidePanel from '@/core/dayPlanner/component/template/RoutineSidePanel.vue'
	import type { PlannerSidePanelTab } from '@/core/dayPlanner/composable/useRoutinePlacement.ts'
	import type { Calendar } from '@/core/dayPlanner/dto/response/Calendar.ts'
	import type { SuggestionResponse } from '@/core/dayPlanner/dto/response/SuggestionResponse.ts'
	import type { RoutineTodoListItemEntity } from '@/core/todoList/dto/response/routine/RoutineTodoListItemEntity.ts'

	const { title, calendar, suggestions, addedIds } = defineProps<{
		title: string
		calendar: Calendar | undefined
		suggestions: SuggestionResponse[]
		addedIds: Set<string>
	}>()

	const emit = defineEmits<{
		openEditDialog: []
		useTemplate: []
		addRepeatingTask: [task: SuggestionResponse]
		'update:selectedItem': [item: RoutineTodoListItemEntity | null]
	}>()
	const panelOpen = defineModel<boolean>('panelOpen', { default: true })
	const activePanel = defineModel<PlannerSidePanelTab>('activePanel', { default: 'details' })
</script>

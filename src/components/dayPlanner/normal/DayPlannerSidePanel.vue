<!-- DayPlannerSidePanel.vue -->
<template>
	<VCard
		v-show="panelOpen || mdAndUp"
		class="d-flex flex-column align-self-stretch"
		elevation="2"
		style="width: 380px; min-width: 280px"
	>
		<VCardTitle class="pt-4 px-5 pb-2 d-flex flex-column ga-2">
			<div class="d-flex justify-space-between align-center">
				<span class="text-grey-lighten-1">
					{{ activePanel === 'details' ? 'Day Details' : 'Routine Tasks' }}
				</span>
				<div class="d-flex align-center ga-2">
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
						Edit
					</VBtn>
					<VIconBtn
						class="d-md-none"
						color="secondaryOutline"
						icon="xmark"
						variant="tonal"
						size="36"
						@click="panelOpen = false"
					/>
				</div>
			</div>
			<VBtnToggle
				v-model="activePanel"
				mandatory
				class="d-none d-md-flex"
				style="width: 100%"
				density="compact"
				variant="outlined"
				color="secondaryOutline"
			>
				<VBtn
					value="details"
					prependIcon="calendar-day"
					style="flex: 1"
				>
					Details
				</VBtn>
				<VBtn
					value="routine"
					prependIcon="rotate"
					style="flex: 1"
				>
					Routine
				</VBtn>
			</VBtnToggle>
		</VCardTitle>
		<DayDetailsPanel
			v-if="activePanel === 'details'"
			:title
			:calendar
			:repeatingTasks="suggestions"
			:addedIds
			@useTemplate="emit('useTemplate')"
			@addRepeatingTask="task => emit('addRepeatingTask', task)"
		/>
		<RoutineSidePanel
			v-else
			@update:selectedItem="item => emit('update:selectedItem', item)"
		/>
	</VCard>
</template>

<script setup lang="ts">
	import { useDisplay } from 'vuetify'
	import DayDetailsPanel from '@/components/dayPlanner/normal/DayDetailsPanel.vue'
	import RoutineSidePanel from '@/components/dayPlanner/template/RoutineSidePanel.vue'
	import type { Calendar } from '@/dtos/response/activityPlanning/Calendar.ts'
	import type { SuggestionResponse } from '@/dtos/response/activityPlanning/SuggestionResponse.ts'
	import type { RoutineTodoListItemEntity } from '@/dtos/response/todoList/routine/RoutineTodoListItemEntity.ts'

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
	const activePanel = defineModel<'details' | 'routine'>('activePanel', { default: 'details' })

	const { mdAndUp } = useDisplay()
</script>

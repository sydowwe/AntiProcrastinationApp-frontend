<!-- DayDetailsPanel.vue -->
<template>
	<div
		class="detail-panel d-flex flex-column pa-4 flex-fill"
		style="min-height: 0"
	>
		<!-- Day Info Section -->
		<div
			v-if="calendar?.weather || calendar?.label || calendar?.notes || calendar?.holidayName"
			class="d-flex flex-column ga-4"
		>
			<div class="d-flex ga-2 align-center">
				<VIcon icon="tag"></VIcon>
				<h2 v-if="calendar?.label">{{ calendar.label }}</h2>
			</div>

			<div
				v-if="calendar"
				class="d-flex align-center ga-2"
			>
				<DayTypeChip
					:dayType="calendar.dayType"
					isTonal
				/>
				<span
					v-if="calendar.location"
					class="mt-1 d-flex align-start"
				>
					<VIcon
						size="16"
						icon="location-dot"
						style="margin-right: 2px"
					></VIcon>
					<span class="text-body-2 text-medium-emphasis font-italic">
						{{ calendar.location }}
					</span>
				</span>
			</div>

			<SubtleCard
				v-if="calendar?.holidayName"
				title="Holiday name"
				color="error"
				:text="calendar.holidayName"
				icon="gift"
			></SubtleCard>

			<SubtleCard
				v-if="calendar?.weather"
				title="Weather"
				color="info"
				:text="calendar.weather"
				icon="cloud-sun"
			></SubtleCard>

			<SubtleCard
				v-if="calendar?.notes"
				title="Notes"
				color="warning"
				:text="calendar.notes"
				icon="note-sticky"
			></SubtleCard>
		</div>

		<VDivider
			class="my-5"
			opacity="0.3"
		/>

		<div class="mb-6">
			<DayTemplatePicker
				:calendar
				@useTemplate="emit('useTemplate')"
			/>
		</div>

		<template v-if="repeatingTasks?.length">
			<VDivider
				class="my-5"
				opacity="0.3"
			/>
			<div class="mb-2">
				<RepeatingTasksSection
					:tasks="repeatingTasks"
					:addedIds
					@add="(task: SuggestionResponse) => emit('addRepeatingTask', task)"
				/>
			</div>
		</template>

		<VDivider
			class="mb-5"
			opacity="0.3"
		/>

		<OverdueTasksBanner :calendar />
	</div>
</template>

<script setup lang="ts">
	import type { Calendar } from '@/dtos/response/activityPlanning/Calendar.ts'
	import type { SuggestionResponse } from '@/dtos/response/activityPlanning/SuggestionResponse.ts'
	import DayTypeChip from '@/components/dayPlanner/misc/DayTypeChip.vue'
	import SubtleCard from '@/components/general/feedback/SubtleCard.vue'
	import DayTemplatePicker from '@/components/dayPlanner/normal/DayTemplatePicker.vue'
	import RepeatingTasksSection from '@/components/dayPlanner/normal/RepeatingTasksSection.vue'
	import OverdueTasksBanner from '@/components/dayPlanner/normal/OverdueTasksBanner.vue'

	const { calendar, repeatingTasks, addedIds } = defineProps<{
		title: string
		calendar?: Calendar
		repeatingTasks?: SuggestionResponse[]
		addedIds?: Set<string>
	}>()

	const emit = defineEmits<{
		openDetails: []
		useTemplate: []
		addRepeatingTask: [task: SuggestionResponse]
	}>()
</script>

<style scoped>
	.detail-panel {
		overflow-y: auto;
	}
</style>

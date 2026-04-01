<template>
	<VCard
		class="h-100 d-flex flex-column template-card"
		:class="{ 'inactive-template': !template.isActive, 'compare-selected': isCompareSelected }"
		elevation="2"
		@click="compareMode ? emit('toggleCompare') : emit('click')"
	>
		<VCardTitle class="pa-4 pb-2 d-flex justify-space-between align-center">
			<div class="d-flex align-center ga-2">
				<VCheckbox
					v-if="compareMode"
					:modelValue="isCompareSelected"
					hideDetails
					density="compact"
					class="flex-grow-0"
					@click.stop="emit('toggleCompare')"
				/>
				<VIcon
					v-if="template.icon"
					class="ma-1"
				>
					{{ template.icon }}
				</VIcon>
				<span>{{ template.name }}</span>

				<VSwitch
					:modelValue="template.isActive"
					class="ml-2"
					hideDetails
					density="compact"
					color="primary"
					:label="template.isActive ? 'Active' : 'Inactive'"
					@click.stop
					@update:modelValue="emit('toggleActive')"
				></VSwitch>
			</div>
			<div class="d-flex align-center ga-1">
				<DayTypeChip
					:dayType="template.suggestedForDayType"
					isTonal
				/>
				<VBtn
					icon="thumbtack"
					variant="text"
					size="small"
					:color="isPinned ? 'primary' : 'grey'"
					@click.stop="emit('togglePin')"
				/>
			</div>
		</VCardTitle>

		<VCardText class="flex-fill">
			<MiniTimeline
				v-if="tasks && tasks.length"
				class="mb-4"
				label="Tasks"
				:tasks="tasks"
				:startTime="template.defaultWakeUpTime"
				:endTime="template.defaultBedTime"
			/>

			<div class="mb-4 d-flex justify-space-between align-center">
				<div class="d-flex align-center ga-4">
					<span>Used {{ template.usageCount }} times</span>
					<span v-if="template.lastUsedAt">Last: {{ formatToDate(new Date(template.lastUsedAt)) }}</span>
				</div>
				<div
					v-if="template.scheduledDays?.length"
					class="d-flex ga-1"
				>
					<VBtnToggle
						v-model="template.scheduledDays"
						multiple
						density="compact"
						color="primaryOutline"
						variant="tonal"
						divided
						style="pointer-events: none; user-select: none"
					>
						<VBtn
							v-for="day in dayOfWeekOptions"
							:key="day.value"
							:value="day.value"
							size="x-small"
							style="border: 1px #777 solid"
						>
							{{ day.label }}
						</VBtn>
					</VBtnToggle>
				</div>
			</div>

			<div
				v-if="template.tags.length > 0"
				class="mb-3 template-meta"
			>
				<VChip
					v-for="tag in template.tags"
					:key="tag"
					size="small"
					class="mr-2"
				>
					{{ tag }}
				</VChip>
			</div>

			<div
				v-if="template.description"
				class="mb-3"
			>
				{{ template.description }}
			</div>
		</VCardText>

		<VCardActions class="pa-4 d-flex align-center flex-wrap ga-2">
			<span v-if="template.suggestedLocation">
				<VIcon class="mb-1">location-dot</VIcon>
				{{ template.suggestedLocation }}
			</span>
			<VSpacer />
			<VBtn
				color="primary"
				size="small"
				prependIcon="play"
				@click.stop="emit('applyToday')"
			>
				Use Today
			</VBtn>
			<VBtn
				color="secondary"
				size="small"
				@click.stop="emit('duplicate')"
			>
				Duplicate
			</VBtn>
			<VBtn
				color="primaryOutline"
				size="small"
				variant="tonal"
				@click.stop="emit('edit')"
			>
				Edit Details
			</VBtn>
			<VBtn
				variant="tonal"
				size="small"
				color="secondaryOutline"
				@click.stop="emit('delete')"
			>
				Delete
			</VBtn>
		</VCardActions>
	</VCard>
</template>

<script setup lang="ts">
	import type { TaskPlannerDayTemplate } from '@/dtos/response/activityPlanning/template/TaskPlannerDayTemplate.ts'
	import type { TemplatePlannerTask } from '@/dtos/response/activityPlanning/template/TemplatePlannerTask.ts'
	import DayTypeChip from '@/components/dayPlanner/misc/DayTypeChip.vue'
	import MiniTimeline from '@/components/dayPlanner/template/MiniTimeline.vue'
	import { dayOfWeekOptions } from '@/dtos/enum/DayOfWeek.ts'
	import { useMoment } from '@/utils/DateTimeHelper.ts'

	const { tasks } = defineProps<{
		template: TaskPlannerDayTemplate
		isPinned: boolean
		tasks?: TemplatePlannerTask[]
		compareMode?: boolean
		isCompareSelected?: boolean
	}>()

	const emit = defineEmits<{
		click: []
		edit: []
		delete: []
		duplicate: []
		togglePin: []
		toggleActive: []
		applyToday: []
		toggleCompare: []
	}>()

	const { formatToDate } = useMoment()
</script>

<style scoped>
	.template-card {
		cursor: pointer;
		transition:
			transform 0.2s,
			box-shadow 0.2s;
	}

	.template-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.inactive-template {
		opacity: 0.7;
	}

	.compare-selected {
		border: 2px solid rgb(var(--v-theme-primary));
	}

	.template-meta {
		min-height: 32px;
	}
</style>

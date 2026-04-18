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
			</div>
			<div class="d-flex align-center ga-3">
				<DayTypeChip
					:dayType="template.suggestedForDayType"
					isTonal
					class="mr-1"
				/>
				<VSwitch
					:modelValue="template.isActive"
					hideDetails
					density="compact"
					color="primary"
					:label="template.isActive ? 'Active' : 'Inactive'"
					@click.stop
					@update:modelValue="emit('toggleActive')"
				></VSwitch>
				<VIconBtn
					:class="{ 'pin-unpinned': !isPinned }"
					icon="thumbtack"
					variant="text"
					size="small"
					:color="isPinned ? 'secondaryOutline' : 'base'"
					@click.stop="emit('togglePin')"
				/>
			</div>
		</VCardTitle>

		<VCardText class="flex-fill">
			<MiniTimeline
				v-if="tasks && tasks.length"
				class="mb-3"
				label="Tasks"
				:tasks="tasks"
				:startTime="template.defaultWakeUpTime"
				:endTime="template.defaultBedTime"
			/>
			<div class="mb-3 d-flex justify-space-between align-center">
				<div class="text-caption mt-1 d-flex align-center ga-2">
					<span v-if="template.defaultWakeUpTime">
						<VIcon class="mb-1 mr-1">sun</VIcon>
						{{ Time.getString(template.defaultWakeUpTime) }}
					</span>
					<span v-if="template.defaultBedTime">
						<VIcon class="ml-2 mb-1">moon</VIcon>
						{{ Time.getString(template.defaultBedTime) }}
					</span>
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

			<div class="mb-4 d-flex justify-space-between align-center">
				<div class="d-flex align-center ga-4">
					<span>Used {{ template.usageCount }} times</span>
					<span v-if="template.lastUsedAt">Last: {{ formatToDate(new Date(template.lastUsedAt)) }}</span>
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

		<VCardActions class="pa-4 d-flex align-center justify-space-between">
			<div class="d-flex align-center justify-end ga-2">
				<VBtn
					variant="outlined"
					prependIcon="trash"
					size="small"
					color="secondaryOutline"
					@click.stop="emit('delete')"
				>
					Delete
				</VBtn>
				<VDivider vertical />
				<VBtn
					color="primaryOutline"
					size="small"
					variant="tonal"
					prependIcon="pencil"
					@click.stop="emit('edit')"
				>
					Edit Details
				</VBtn>
				<VBtn
					variant="tonal"
					color="secondaryOutline"
					prependIcon="clone"
					size="small"
					@click.stop="emit('duplicate')"
				>
					Duplicate
				</VBtn>
			</div>

			<VBtn
				color="primary"
				prependIcon="play"
				@click.stop="emit('applyToday')"
			>
				Use Today
			</VBtn>
		</VCardActions>
	</VCard>
</template>

<script setup lang="ts">
	import type { TaskPlannerDayTemplate } from '@/dtos/response/activityPlanning/template/TaskPlannerDayTemplate.ts'
	import type { TemplatePlannerTask } from '@/dtos/response/activityPlanning/template/TemplatePlannerTask.ts'
	import MiniTimeline from '@/components/dayPlanner/template/MiniTimeline.vue'
	import { dayOfWeekOptions } from '@/dtos/enum/DayOfWeek.ts'
	import { useDateTime } from '@/utils/DateTimeHelper.ts'
	import { Time } from '@/dtos/dto/Time.ts'
	import DayTypeChip from '@/components/dayPlanner/misc/DayTypeChip.vue'

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

	const { formatToDate } = useDateTime()
</script>

<style scoped>
	.pin-unpinned:deep(.v-icon) {
		transform: rotate(40deg);
		transition: transform 0.2s ease;
	}

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

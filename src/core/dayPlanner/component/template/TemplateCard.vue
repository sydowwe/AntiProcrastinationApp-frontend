<template>
	<VCard
		class="h-100 d-flex flex-column template-card"
		:class="{ 'inactive-template': !template.isActive, 'compare-selected': isCompareSelected }"
		elevation="2"
		@click="compareMode ? emit('toggleCompare') : emit('click')"
	>
		<!-- The name is the only flexible part of this row: it truncates, the right-hand controls keep
		     their width. Before, the name held its width and the switch label wrapped a letter per line
		     while the chip clipped (F52). The switch has no visible label for the same reason — with one,
		     the name was left two letters; its thumb shows the state and `aria-label` names it. -->
		<VCardTitle class="pa-4 pb-2 d-flex justify-space-between align-center ga-2">
			<div
				class="d-flex align-center ga-2"
				style="min-width: 0"
			>
				<VCheckbox
					v-if="compareMode"
					:modelValue="isCompareSelected"
					hideDetails
					density="compact"
					:aria-label="$t('planner.a11y.compareTemplate', { name: template.name })"
					class="flex-grow-0 flex-shrink-0 me-1"
					@click.stop="emit('toggleCompare')"
				/>
				<!-- Decorative, and it overlaps the compare checkbox's ripple area — without this the
				     icon swallows a direct click on the checkbox (F56, control #2). -->
				<VIcon
					v-if="template.icon"
					class="ma-1"
					style="pointer-events: none"
				>
					{{ template.icon }}
				</VIcon>
				<span
					class="text-truncate"
					:title="template.name"
				>
					{{ template.name }}
				</span>
			</div>
			<div class="d-flex align-center ga-3 flex-shrink-0">
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
					:aria-label="$t('planner.a11y.templateActive', { name: template.name })"
					@click.stop
					@update:modelValue="emit('toggleActive')"
				></VSwitch>
				<VIconBtn
					:class="{ 'pin-unpinned': !isPinned }"
					icon="thumbtack"
					variant="text"
					size="small"
					:color="isPinned ? 'secondaryOutline' : 'base'"
					:aria-label="
						isPinned
							? $t('planner.a11y.unpinTemplate', { name: template.name })
							: $t('planner.a11y.pinTemplate', { name: template.name })
					"
					@click.stop="emit('togglePin')"
				/>
			</div>
		</VCardTitle>

		<VCardText class="flex-fill">
			<MiniTimeline
				v-if="tasks && tasks.length"
				class="mb-3"
				:label="$t('planner.template.tasksCount', { count: tasks.length }, tasks.length)"
				:tasks="tasks"
				:startTime="template.defaultWakeUpTime"
				:endTime="template.defaultBedTime"
			/>
			<!-- Wraps: the times plus seven day buttons are wider than a card column at 1440 px, and the
			     card clipped Sunday. The same goes for the action row below. -->
			<div class="mb-3 d-flex flex-wrap justify-space-between align-center ga-2">
				<div class="text-caption mt-1 d-flex align-center ga-2">
					<span v-if="template.defaultWakeUpTime">
						<VIcon
							icon="sun"
							class="mb-1 mr-1"
						/>
						{{ Time.getString(template.defaultWakeUpTime) }}
					</span>
					<span v-if="template.defaultBedTime">
						<VIcon
							icon="moon"
							class="ml-2 mb-1"
						/>
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
					<span>{{ $t('planner.template.usedTimes', { count: template.usageCount }) }}</span>
					<span v-if="template.lastUsedAt">
						{{ $t('planner.template.lastUsed', { date: formatToDate(new Date(template.lastUsedAt)) }) }}
					</span>
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

		<VCardActions class="pa-4 d-flex flex-wrap align-center justify-space-between ga-2">
			<div class="d-flex flex-wrap align-center ga-2">
				<VBtn
					variant="outlined"
					prependIcon="trash"
					size="small"
					color="secondaryOutline"
					@click.stop="emit('delete')"
				>
					{{ $t('general.delete') }}
				</VBtn>
				<VDivider vertical />
				<VBtn
					color="primaryOutline"
					size="small"
					variant="tonal"
					prependIcon="pencil"
					@click.stop="emit('edit')"
				>
					{{ $t('planner.template.editDetailsAction') }}
				</VBtn>
				<VBtn
					variant="tonal"
					color="secondaryOutline"
					prependIcon="clone"
					size="small"
					@click.stop="emit('duplicate')"
				>
					{{ $t('planner.template.duplicateAction') }}
				</VBtn>
			</div>

			<VBtn
				color="primary"
				prependIcon="play"
				@click.stop="emit('applyToday')"
			>
				{{ $t('planner.template.useTodayAction') }}
			</VBtn>
		</VCardActions>
	</VCard>
</template>

<script setup lang="ts">
	import type { TaskPlannerDayTemplate } from '@/core/dayPlanner/dto/response/template/TaskPlannerDayTemplate.ts'
	import type { TemplatePlannerTask } from '@/core/dayPlanner/dto/response/template/TemplatePlannerTask.ts'
	import MiniTimeline from '@/core/dayPlanner/component/template/MiniTimeline.vue'
	import { useDayOfWeekOptions } from '@/_common/composable/general/useDayOfWeekOptions.ts'
	import { formatToDate } from '@/_common/utils/DateTimeHelper.ts'
	import { Time } from '@/_common/dto/dto/Time.ts'
	import DayTypeChip from '@/core/dayPlanner/component/misc/DayTypeChip.vue'

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

	const dayOfWeekOptions = useDayOfWeekOptions()
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

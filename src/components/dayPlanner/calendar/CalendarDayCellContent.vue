<template>
<div
	class="cell-content"
	:style="[completionBgStyle, dayTypeBorderStyle]"
>
	<!-- Today top accent -->
	<div v-if="day.isToday" class="today-accent"/>

	<!-- Selection checkbox -->
	<VCheckbox
		v-if="selectionMode"
		:modelValue="selected"
		class="selection-checkbox"
		density="compact"
		hideDetails
		@click.stop
		@update:modelValue="emit('toggleSelection', day.id)"
	/>

	<!-- Mini timeline -->
	<MiniTimeline
		v-if="tasks.length > 0"
		:tasks
		:startTime="day.wakeUpTime"
		:endTime="day.bedTime"
	/>

	<div class="d-flex ga-3 align-center">
		<!-- Wake/Bed Time -->
		<div v-if="day.wakeUpTime || day.bedTime" class="cell-info">
			<VIcon icon="fas fa-clock" size="small" class="mr-1"/>
			<span class="info-text">{{ day.wakeUpTime.getString() }} - {{ day.bedTime.getString() }}</span>
		</div>

		<!-- Tasks Progress -->
		<div class="cell-info tasks-info flex-grow-1">
			<VIcon icon="fas fa-list-check" size="small" class="mr-1"/>
			<VTooltip v-if="smAndUp && tasks.length > 0" location="end">
				<template #activator="{ props: tooltipProps }">
					<div v-bind="tooltipProps" class="tasks-inner">
						<span class="info-text">{{ day.completedTasks }}/{{ day.totalTasks }} tasks</span>
						<VProgressLinear
							v-if="day.totalTasks > 0"
							:modelValue="day.completionRate"
							:color="day.completionRate >= 80 ? 'success' : day.completionRate >= 50 ? 'warning' : 'error'"
							height="6"
							rounded
							class="mt-1"
						/>
						<VChip
							v-if="day.totalTasks > 0"
							size="x-small"
							:color="day.completionRate >= 80 ? 'success' : day.completionRate >= 50 ? 'warning' : 'error'"
							variant="flat"
							class="mt-1"
						>
							{{ Math.round(day.completionRate) }}%
						</VChip>
					</div>
				</template>
				<div class="task-tooltip-content">
					<div v-for="task in tasks" :key="task.id" class="task-tooltip-row">
						<span class="task-time">{{ task.startTime.getString() }}–{{ task.endTime.getString() }}</span>
						<span>{{ task.activity.name }}</span>
					</div>
				</div>
			</VTooltip>
			<div v-else class="tasks-inner">
				<span class="info-text">{{ day.completedTasks }}/{{ day.totalTasks }} tasks</span>
				<VProgressLinear
					v-if="day.totalTasks > 0"
					:modelValue="day.completionRate"
					:color="day.completionRate >= 80 ? 'success' : day.completionRate >= 50 ? 'warning' : 'error'"
					height="6"
					rounded
					class="mt-1"
				/>
				<VChip
					v-if="day.totalTasks > 0"
					size="x-small"
					:color="day.completionRate >= 80 ? 'success' : day.completionRate >= 50 ? 'warning' : 'error'"
					variant="flat"
					class="mt-1"
				>
					{{ Math.round(day.completionRate) }}%
				</VChip>
			</div>
		</div>
	</div>

	<!-- Applied Template -->
	<div v-if="day.appliedTemplateName" class="cell-info secondary-info">
		<VIcon icon="fas fa-file-lines" size="small" class="mr-1"/>
		<span class="info-text">{{ day.appliedTemplateName }}</span>
	</div>

	<!-- Weather -->
	<div v-if="day.weather" class="cell-info secondary-info">
		<VIcon icon="fas fa-cloud-sun" size="small" class="mr-1"/>
		<span class="info-text">{{ day.weather }}</span>
	</div>

	<!-- Location -->
	<div v-if="day.location" class="cell-info secondary-info">
		<VIcon :icon="`fas fa-${LOCATION_ICONS[day.location]}`" size="small" class="mr-1"/>
		<span class="info-text">{{ LOCATION_LABELS[day.location] }}</span>
	</div>

	<!-- Notes — static view -->
	<div
		v-if="day.notes && !editingNotes"
		class="cell-info notes secondary-info"
		@click.stop="startEditNotes"
	>
		<VIcon icon="fas fa-note-sticky" size="small" class="mr-1"/>
		<span class="info-text notes-text">{{ day.notes }}</span>
		<VIcon icon="fas fa-pen" size="x-small" class="ml-auto edit-icon"/>
	</div>

	<!-- Notes — edit mode -->
	<VTextField
		v-else-if="editingNotes"
		v-model="notesInput"
		density="compact"
		variant="outlined"
		autofocus
		hideDetails
		@blur="saveNotes"
		@keydown.enter.prevent="saveNotes"
		@keydown.esc.prevent="editingNotes = false"
		@click.stop
	/>

	<!-- Notes — add prompt when empty -->
	<div
		v-else
		class="cell-info secondary-info add-notes-btn"
		@click.stop="startEditNotes"
	>
		<VIcon icon="fas fa-plus" size="x-small" class="mr-1" style="opacity: 0.4"/>
		<span class="info-text" style="opacity: 0.35; font-size: 11px">Add notes</span>
	</div>

	<!-- Quick Apply Template -->
	<VMenu v-if="!selectionMode && activeTemplates.length > 0" location="bottom start">
		<template #activator="{ props: menuProps }">
			<VBtn
				v-bind="menuProps"
				variant="tonal"
				color="primary"
				size="x-small"
				class="quick-apply-btn"
				prependIcon="fas fa-wand-magic-sparkles"
				@click.stop
			>
				Apply
			</VBtn>
		</template>
		<VList density="compact" minWidth="180">
			<VListItem
				v-for="template in activeTemplates"
				:key="template.id"
				:prependIcon="template.icon ? `fas fa-${template.icon}` : 'fas fa-file-lines'"
				:title="template.name"
				@click="emit('quickApply', day, template)"
			/>
		</VList>
	</VMenu>
</div>
</template>

<script setup lang="ts">
import {computed, ref} from 'vue'
import {useDisplay} from 'vuetify/framework'
import {Calendar} from '@/dtos/response/activityPlanning/Calendar.ts'
import {DayType, getDayTypeColor} from '@/dtos/enum/DayType.ts'
import {LOCATION_ICONS, LOCATION_LABELS} from '@/dtos/enum/Location.ts'
import type {PlannerTask} from '@/dtos/response/activityPlanning/PlannerTask.ts'
import type {TaskPlannerDayTemplate} from '@/dtos/response/activityPlanning/template/TaskPlannerDayTemplate.ts'
import MiniTimeline from '@/components/dayPlanner/template/MiniTimeline.vue'

const props = defineProps<{
	day: Calendar
	selectionMode: boolean
	selected: boolean
	tasks: PlannerTask[]
	activeTemplates: TaskPlannerDayTemplate[]
}>()

const emit = defineEmits<{
	quickApply: [day: Calendar, template: TaskPlannerDayTemplate]
	toggleSelection: [calendarId: number]
	updateNotes: [calendarId: number, notes: string]
}>()

const {smAndUp} = useDisplay()

const editingNotes = ref(false)
const notesInput = ref('')

const completionBgStyle = computed(() => {
	if (props.day.totalTasks === 0) return {}
	const rate = props.day.completionRate
	const isPast = props.day.date < new Date().toISOString().slice(0, 10)
	if (rate >= 80) return {backgroundColor: 'rgba(var(--v-theme-success), 0.07)'}
	if (rate >= 50) return {backgroundColor: 'rgba(var(--v-theme-warning), 0.07)'}
	return isPast ? {backgroundColor: 'rgba(var(--v-theme-error), 0.07)'} : {}
})

const dayTypeBorderStyle = computed(() => {
	if ([DayType.Workday, DayType.Weekend].includes(props.day.dayType)) return {}
	const color = getDayTypeColor(props.day.dayType)
	return {borderLeft: `3px solid rgb(var(--v-theme-${color}))`}
})

function startEditNotes() {
	notesInput.value = props.day.notes ?? ''
	editingNotes.value = true
}

function saveNotes() {
	editingNotes.value = false
	emit('updateNotes', props.day.id, notesInput.value)
}
</script>

<style scoped>
.cell-content {
	flex: 1;
	padding: 8px;
	overflow-y: auto;
	display: flex;
	flex-direction: column;
	gap: 10px;
	position: relative;
}

.today-accent {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 3px;
	background: rgb(var(--v-theme-primary));
	border-radius: 0 0 2px 2px;
}

.selection-checkbox {
	position: absolute;
	top: 4px;
	left: 4px;
	z-index: 1;
}

.cell-info {
	display: flex;
	align-items: flex-start;
	font-size: 13px;
	color: rgb(var(--v-theme-on-surface));
	line-height: 1.5;
	gap: 4px;
	padding: 4px 0;
}

.cell-info.tasks-info {
	padding: 6px 8px;
	background-color: rgba(var(--v-border-color), 0.12);
	border-radius: 6px;
	border: 1px solid rgba(var(--v-border-color), 0.15);
}

.cell-info.secondary-info {
	padding: 4px 0;
	opacity: 0.9;
}

.cell-info.secondary-info .info-text {
	font-size: 12px;
}

.cell-info.notes {
	cursor: pointer;
}

.cell-info.notes .edit-icon {
	opacity: 0;
	transition: opacity 0.15s;
}

.cell-info.notes:hover .edit-icon {
	opacity: 0.5;
}

.info-text {
	flex: 1;
	word-wrap: break-word;
	overflow-wrap: break-word;
	white-space: normal;
}

.tasks-inner {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.add-notes-btn {
	cursor: pointer;
}

.quick-apply-btn {
	align-self: flex-start;
}

.task-tooltip-content {
	display: flex;
	flex-direction: column;
	gap: 4px;
	font-size: 12px;
	max-width: 260px;
}

.task-tooltip-row {
	display: flex;
	gap: 8px;
}

.task-time {
	opacity: 0.7;
	white-space: nowrap;
}

@media (max-width: 960px) {
	.cell-content {
		padding: 10px;
		gap: 8px;
	}

	.cell-info {
		font-size: 12px;
	}

	.cell-info.tasks-info {
		padding: 5px 6px;
	}
}

@media (max-width: 600px) {
	.cell-content {
		padding: 8px;
		gap: 6px;
	}

	.cell-info {
		font-size: 11px;
	}
}
</style>

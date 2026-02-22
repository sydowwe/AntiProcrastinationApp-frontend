<template>
<CalendarGrid @dayClick="handleDayClick">
	<template #day-cell-content="{ day }">
		<div class="cell-content">
			<div class="d-flex ga-3 align-center">
				<!-- Wake/Bed Time -->
				<div v-if="asCalendar(day).wakeUpTime || asCalendar(day).bedTime" class="cell-info">
					<VIcon icon="fas fa-clock" size="small" class="mr-1"/>
					<span class="info-text">{{ asCalendar(day).wakeUpTime.getString() }} - {{ asCalendar(day).bedTime.getString() }}</span>
				</div>

				<!-- Tasks Progress -->
				<div class="cell-info tasks-info flex-grow-1">
					<VIcon icon="fas fa-list-check" size="small" class="mr-1"/>
					<div class="tasks-progress">
						<span class="info-text">{{ asCalendar(day).completedTasks }}/{{ asCalendar(day).totalTasks }} tasks</span>
						<VProgressLinear
							v-if="asCalendar(day).totalTasks > 0"
							:modelValue="asCalendar(day).completionRate"
							:color="asCalendar(day).completionRate >= 80 ? 'success' : asCalendar(day).completionRate >= 50 ? 'warning' : 'error'"
							height="6"
							rounded
							class="mt-1"
						/>
						<VChip
							v-if="asCalendar(day).totalTasks > 0"
							size="x-small"
							:color="asCalendar(day).completionRate >= 80 ? 'success' : asCalendar(day).completionRate >= 50 ? 'warning' : 'error'"
							variant="flat"
							class="mt-1"
						>
							{{ Math.round(asCalendar(day).completionRate) }}%
						</VChip>
					</div>
				</div>
			</div>

			<!-- Applied Template -->
			<div v-if="asCalendar(day).appliedTemplateName" class="cell-info secondary-info">
				<VIcon icon="fas fa-file-lines" size="small" class="mr-1"/>
				<span class="info-text">{{ asCalendar(day).appliedTemplateName }}</span>
			</div>

			<!-- Weather -->
			<div v-if="asCalendar(day).weather" class="cell-info secondary-info">
				<VIcon icon="fas fa-cloud-sun" size="small" class="mr-1"/>
				<span class="info-text">{{ asCalendar(day).weather }}</span>
			</div>

			<!-- Notes -->
			<div v-if="asCalendar(day).notes" class="cell-info notes secondary-info">
				<VIcon icon="fas fa-note-sticky" size="small" class="mr-1"/>
				<span class="info-text">{{ asCalendar(day).notes }}</span>
			</div>
		</div>
	</template>
</CalendarGrid>
</template>

<script setup lang="ts">
import type {ICalendar} from '@/dtos/response/activityPlanning/ICalendar.ts'
import CalendarGrid from '@/components/general/calendar/CalendarGrid.vue'
import {Calendar} from '@/dtos/response/activityPlanning/Calendar.ts'
import router from '@/plugins/router.ts'
import {useMoment} from '@/scripts/momentHelper.ts'

const {usStringToUrlString} = useMoment()

function asCalendar(day: ICalendar): Calendar {
	return day as Calendar
}

function handleDayClick(day: ICalendar) {
	const cal = day as Calendar
	router.push({name: 'dayPlanner', params: {date: usStringToUrlString(cal.date)}, state: {calendarId: cal.id}})
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

.info-text {
	flex: 1;
}

.tasks-progress {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.cell-info.notes {
	max-width: 100%;
}

.cell-info .info-text {
	word-wrap: break-word;
	overflow-wrap: break-word;
	white-space: normal;
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

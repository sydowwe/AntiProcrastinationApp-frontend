<template>
	<div
		class="cell-content"
		:style="completionBgStyle"
	>
		<div class="d-flex align-center justify-space-between">
			<!-- Wake/Bed Time -->
			<div
				v-if="day.wakeUpTime || day.bedTime"
				class="cell-info"
			>
				<VIcon
					style="margin-top: 2px"
					icon="fas fa-clock"
					size="small"
				/>
				<span class="info-text">{{ day.wakeUpTime.getString() }} - {{ day.bedTime.getString() }}</span>
			</div>

			<!-- Location -->
			<div
				v-if="day.location"
				class="cell-info secondary-info"
			>
				<VIcon
					:icon="`fas fa-${LOCATION_ICONS[day.location]}`"
					size="small"
					class="mr-1"
				/>
				<span class="info-text">{{ LOCATION_LABELS[day.location] }}</span>
			</div>
		</div>

		<div class="d-flex flex-column ga-1">
			<!-- Tasks Progress -->
			<CellTaskProgress
				:day
				:tasks
			/>

			<!-- Mini timeline -->
			<MiniTimeline
				v-if="tasks.length > 0"
				:showCount="false"
				:tasks
				:startTime="day.wakeUpTime"
				:endTime="day.bedTime"
			/>
		</div>

		<!-- Applied Template -->
		<div
			v-if="day.appliedTemplateName"
			class="cell-info secondary-info"
		>
			<VIcon
				icon="fas fa-file-lines"
				size="small"
				class="mr-1"
			/>
			<span class="info-text">{{ day.appliedTemplateName }}</span>
		</div>

		<!-- Weather -->
		<div
			v-if="day.weather"
			class="cell-info secondary-info"
		>
			<VIcon
				icon="fas fa-cloud-sun"
				size="small"
				class="mr-1"
			/>
			<span class="info-text">{{ day.weather }}</span>
		</div>

		<!-- Notes — read only -->
		<div
			v-if="day.notes"
			class="cell-info notes secondary-info"
		>
			<VIcon
				icon="fas fa-note-sticky"
				size="small"
				class="mr-1"
			/>
			<span class="info-text notes-text">{{ day.notes }}</span>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import type { Calendar } from '@/dtos/response/activityPlanning/Calendar.ts'
	import { LOCATION_ICONS, LOCATION_LABELS } from '@/dtos/enum/Location.ts'
	import type { PlannerTask } from '@/dtos/response/activityPlanning/PlannerTask.ts'
	import MiniTimeline from '@/components/dayPlanner/template/MiniTimeline.vue'
	import CellTaskProgress from '@/components/dayPlanner/calendar/CellTaskProgress.vue'

	const props = defineProps<{
		day: Calendar
		selected: boolean
		tasks: PlannerTask[]
	}>()

	const completionBgStyle = computed(() => {
		if (props.day.totalTasks === 0) return {}
		const rate = props.day.completionRate
		const isPast = props.day.date < new Date().toISOString().slice(0, 10)
		if (rate >= 80) return { backgroundColor: 'rgba(var(--v-theme-success), 0.07)' }
		if (rate >= 50) return { backgroundColor: 'rgba(var(--v-theme-warning), 0.07)' }
		return isPast ? { backgroundColor: 'rgba(var(--v-theme-error), 0.07)' } : {}
	})
</script>

<style scoped>
	.cell-content {
		flex: 1;
		padding: 8px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 6px;
		position: relative;
	}

	.cell-info {
		display: flex;
		align-items: flex-start;
		font-size: 13px;
		color: rgb(var(--v-theme-on-surface));
		line-height: 1.5;
		gap: 4px;
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
		word-wrap: break-word;
		overflow-wrap: break-word;
		white-space: normal;
	}

	@media (max-width: 960px) {
		.cell-content {
			padding: 10px;
			gap: 6px;
		}

		.cell-info {
			font-size: 12px;
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

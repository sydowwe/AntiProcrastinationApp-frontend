<template>
	<div
		class="cell-content"
		:style="completionBgStyle"
	>
		<div
			v-if="smAndUp"
			class="d-flex align-center justify-space-between"
		>
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
				<span class="info-text">{{ $t(`planner.location.${day.location}`) }}</span>
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

		<!-- Below `sm` the cell is ~50 px wide, too narrow for any of the rows below: each would wrap a word or
		     two per line, and the clock range ran to three lines. Their icons stay as markers; the day itself has
		     the details. -->
		<div
			v-if="!smAndUp && compactMarkers.length > 0"
			class="d-flex flex-wrap ga-1"
			style="opacity: 0.8"
		>
			<VIcon
				v-for="icon in compactMarkers"
				:key="icon"
				:icon
				size="x-small"
			/>
		</div>

		<!-- Applied Template -->
		<div
			v-if="smAndUp && day.appliedTemplateName"
			class="cell-info secondary-info"
		>
			<VIcon
				icon="fas fa-file-lines"
				size="small"
				class="mr-1"
			/>
			<!-- A pointer shortcut only. The cell is itself `role="button"` (open the day, or select it in a bulk
			     mode), so its contents are presentational and a focusable link here would be a control nested in a
			     control. Keyboard users reach the same template through the day's own *Using:* link in
			     `DayTemplatePicker`. `.stop` keeps the click from also opening the day. -->
			<RouterLink
				v-if="day.appliedTemplateId != null"
				:to="{ name: 'dayPlannerTemplate', params: { templateId: day.appliedTemplateId } }"
				class="info-text template-link"
				tabindex="-1"
				@click.stop
			>
				{{ day.appliedTemplateName }}
			</RouterLink>
			<span
				v-else
				class="info-text"
			>
				{{ day.appliedTemplateName }}
			</span>
		</div>

		<!-- Weather -->
		<div
			v-if="smAndUp && day.weather"
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
			v-if="smAndUp && day.notes"
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
	import type { Calendar } from '@/core/dayPlanner/dto/response/Calendar.ts'
	import { LOCATION_ICONS } from '@/core/dayPlanner/dto/enum/Location.ts'
	import type { CalendarTaskSummary } from '@/core/dayPlanner/dto/response/CalendarTaskSummary.ts'
	import MiniTimeline from '@/core/dayPlanner/component/template/MiniTimeline.vue'
	import CellTaskProgress from '@/core/dayPlanner/component/calendar/CellTaskProgress.vue'
	import { isoDateInUserZone } from '@/_common/composable/general/useUserClock.ts'
	import { useDisplay } from 'vuetify/framework'

	const props = defineProps<{
		day: Calendar
		selected: boolean
		tasks: CalendarTaskSummary[]
	}>()

	const { smAndUp } = useDisplay()

	const compactMarkers = computed(() => {
		const icons: string[] = []
		if (props.day.location) icons.push(`fas fa-${LOCATION_ICONS[props.day.location]}`)
		if (props.day.appliedTemplateName) icons.push('fas fa-file-lines')
		if (props.day.weather) icons.push('fas fa-cloud-sun')
		if (props.day.notes) icons.push('fas fa-note-sticky')
		return icons
	})

	const completionBgStyle = computed(() => {
		if (props.day.totalTasks === 0) return {}
		const rate = props.day.completionRate
		// Not `toISOString()`, which is UTC: it tinted today's cell as an unfinished past day during
		// the evening for anyone west of Greenwich.
		const isPast = props.day.date < isoDateInUserZone()
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

	.template-link {
		color: inherit;
		text-decoration: underline dotted;
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

	@media (max-width: 599.98px) {
		.cell-content {
			padding: 4px;
			gap: 4px;
		}

		.cell-info {
			font-size: 11px;
		}
	}
</style>

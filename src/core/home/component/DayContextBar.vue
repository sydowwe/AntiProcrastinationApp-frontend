<!--
	What the user wrote about today in the planner — label, holiday, an unusual day type, location,
	weather, notes — brought back to the dashboard (OP5). All of it already arrives on the day-plan
	response `useTodayPlan` fetches, so this costs no request.

	Renders nothing on an ordinary day. The day type only shows when it is not what the weekday would
	make it anyway (a workday on Tuesday says nothing), and a Holiday day type gives way to the holiday's
	own name rather than printing "Holiday" next to "Christmas Day". Wake-up and bed time are left out:
	every calendar row carries them from the defaults, so they would show on every day and mean nothing.
-->
<template>
	<section
		v-if="hasContext"
		class="d-flex flex-column ga-2 px-4 py-2"
		:aria-label="$t('home.dayContext')"
	>
		<div class="d-flex align-center flex-wrap ga-2">
			<VChip
				v-if="calendar!.label"
				size="small"
				variant="tonal"
				color="primaryOutline"
				prependIcon="fa-tag"
				class="font-weight-bold"
			>
				{{ calendar!.label }}
			</VChip>
			<VChip
				v-if="holiday"
				size="small"
				variant="tonal"
				color="error"
				prependIcon="fa-gift"
			>
				{{ holiday }}
			</VChip>
			<VChip
				v-if="showDayType"
				size="small"
				variant="tonal"
				:color="getDayTypeColor(calendar!.dayType, true)"
				:prependIcon="getDayTypeIcon(calendar!.dayType)"
			>
				{{ $t(`planner.dayType.${calendar!.dayType}`) }}
			</VChip>
			<VChip
				v-if="calendar!.location"
				size="small"
				variant="tonal"
				:prependIcon="LOCATION_ICONS[calendar!.location]"
			>
				{{ $t(`planner.location.${calendar!.location}`) }}
			</VChip>
			<VChip
				v-if="calendar!.weather"
				size="small"
				variant="tonal"
				color="info"
				prependIcon="fa-cloud-sun"
				:title="$t('planner.calendar.weatherTitle')"
			>
				{{ calendar!.weather }}
			</VChip>
		</div>
		<!-- FO1: a vacation or sick day is said out loud, with what it means — the user should not have to
			 wonder whether today's empty routine list is about to cost them a streak. -->
		<div
			v-if="isAway"
			class="d-flex align-start ga-2 text-body-2 text-medium-emphasis"
		>
			<VIconSmall
				icon="umbrella-beach"
				class="mt-1"
			/>
			<span>{{ $t('home.awayToday') }}</span>
		</div>
		<!-- Clamped, with the whole note in the tooltip: a long note must not push the task list
			 off a dashboard that is built not to scroll. -->
		<div
			v-if="calendar!.notes"
			class="d-flex align-start ga-2 text-body-2 text-medium-emphasis"
			:title="calendar!.notes"
		>
			<VIconSmall
				icon="fa-note-sticky"
				color="warning"
				class="mt-1"
				:aria-label="$t('planner.calendar.notesTitle')"
				role="img"
			/>
			<span class="notes">{{ calendar!.notes }}</span>
		</div>
	</section>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import { DayType, getDayTypeColor, getDayTypeIcon } from '@/_common/dto/enum/DayType.ts'
	import { useHolidayLabel } from '@/_common/composable/general/useHolidayLabel.ts'
	import { isAwayDayType } from '@/core/dayPlanner/dto/enum/awayDayType.ts'
	import { LOCATION_ICONS } from '@/core/dayPlanner/dto/enum/Location.ts'
	import type { Calendar } from '@/core/dayPlanner/dto/response/Calendar.ts'

	const { calendar } = defineProps<{
		calendar: Calendar | null
	}>()

	const { holidayLabel } = useHolidayLabel()

	const holiday = computed(() => (calendar ? holidayLabel(calendar) : null))

	const isAway = computed(() => isAwayDayType(calendar?.dayType))

	const showDayType = computed(() => {
		if (!calendar) return false
		const expected = calendar.isWeekend ? DayType.Weekend : DayType.Workday
		if (calendar.dayType === expected) return false
		return !(calendar.dayType === DayType.Holiday && holiday.value)
	})

	const hasContext = computed(
		() =>
			calendar != null &&
			(!!calendar.label ||
				!!holiday.value ||
				showDayType.value ||
				calendar.location != null ||
				!!calendar.weather ||
				!!calendar.notes),
	)
</script>

<style scoped>
	.notes {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		white-space: pre-line;
	}
</style>

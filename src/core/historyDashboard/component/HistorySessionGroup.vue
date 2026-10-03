<!--
	One pomodoro on the day's timeline: collapsed to its span, its focus total and how it ended,
	expandable to its phases — each still a `HistoryRecordItem` with its own edit and delete.

	Collapsed by default. The point of the session is that the morning reads as one sitting, not as
	eight; the phases are there for the user who wants them. The outcome line is descriptive and never
	coloured: a pomodoro stopped after two periods is information, not a failure.
-->
<template>
	<div
		v-auto-animate
		class="d-flex flex-column"
	>
		<div class="d-flex">
			<div class="time-column d-flex flex-column justify-space-between align-center">
				<div class="d-flex align-center w-100">
					<VSheet
						class="time-label pa-1 w-100 text-body-2 text-center font-weight-medium"
						rounded="lg"
						color="surface-light"
					>
						{{ formatToTime(spanStart) }}
					</VSheet>
					<hr class="line" />
				</div>
				<div class="d-flex align-center w-100">
					<VSheet
						class="time-label pa-1 w-100 text-body-2 text-center text-medium-emphasis"
						rounded="lg"
						color="surface-light"
					>
						{{ formatToTime(spanEnd) }}
					</VSheet>
					<hr class="line" />
				</div>
			</div>
			<VCard class="elevation-2 flex-1-0">
				<div class="d-flex align-center">
					<VCardTitle class="d-flex align-center ga-2">
						<VIcon
							icon="fas fa-circle-dot"
							size="18"
						/>
						{{ focusActivityName }}
					</VCardTitle>
					<VChip
						variant="tonal"
						size="small"
						label
					>
						{{ $t('history.session.pomodoroUnit') }}
					</VChip>
				</div>
				<VCardText class="px-4 pt-0 pb-2 d-flex flex-column ga-1">
					<span class="text-body-2 font-weight-medium">
						{{ focusLine }}
					</span>
					<span
						v-if="outcomeLine"
						class="text-body-2 text-medium-emphasis"
					>
						{{ outcomeLine }}
					</span>
				</VCardText>
				<VCardActions class="pt-0">
					<VBtn
						variant="text"
						size="small"
						color="primaryOutline"
						:appendIcon="expanded ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"
						:aria-expanded="expanded"
						@click="expanded = !expanded"
					>
						{{
							expanded
								? $t('history.session.hidePhases')
								: $t('history.session.showPhases', { count: records.length })
						}}
					</VBtn>
				</VCardActions>
			</VCard>
		</div>
		<div
			v-if="expanded"
			class="ms-8 ps-2 border-s-md d-flex flex-column"
		>
			<HistoryRecordItem
				v-for="record in records"
				:key="record.id"
				class="my-2 w-100"
				:record
				@edit="emit('edit', $event)"
				@delete="emit('delete', $event)"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { computed, ref } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { Time } from '@/_common/dto/dto/Time.ts'
	import { formatToTime } from '@/_common/utils/DateTimeHelper.ts'
	import type { ActivityHistory } from '@/core/activityHistory/dto/response/ActivityHistory.ts'
	import type { ActivityHistorySession } from '@/core/activityHistory/dto/response/ActivityHistorySession.ts'
	import { TimerSessionPhase } from '@/core/activityHistory/dto/enum/TimerSessionPhase.ts'
	import { TimerSessionOutcome } from '@/core/activityHistory/dto/enum/TimerSessionOutcome.ts'
	import HistoryRecordItem from '@/core/activityHistory/component/HistoryRecordItem.vue'

	const { session, records } = defineProps<{
		session: ActivityHistorySession
		/** The session's rows on this day, in start order. Never empty. */
		records: ActivityHistory[]
	}>()

	const emit = defineEmits<{ edit: [record: ActivityHistory]; delete: [id: number] }>()

	const { t } = useI18n()
	const expanded = ref(false)

	const focusRecords = computed(() => records.filter(record => record.phase === TimerSessionPhase.Focus))

	const spanStart = computed(() => records[0]!.startTimestamp)
	/** The latest row end, not the last row's: rounding can leave a row ending past the next one's start. */
	const spanEnd = computed(
		() =>
			new Date(
				Math.max(...records.map(record => record.startTimestamp.getTime() + record.length.getInSeconds * 1000)),
			),
	)

	const focusTotal = computed(() =>
		Time.fromMinutes(focusRecords.value.reduce((sum, record) => sum + record.length.getInMinutes, 0)),
	)

	/**
	 * The focus total, set against the plan when the session did not run all of it and carries one. A
	 * completed plan is left as the bare total: its rows already are the plan, give or take rounding.
	 */
	const focusLine = computed(() => {
		const { plannedLength, outcome } = session
		const duration = focusTotal.value.getNice.trim()
		if (plannedLength === null || outcome === TimerSessionOutcome.Completed) {
			return t('history.session.focusTotal', { duration })
		}
		return t('history.session.focusOfPlanned', { duration, planned: plannedLength.getNice.trim() })
	})

	/** Named after its focus activity — the rest activity is the breaks, not what the sitting was for. */
	const focusActivityName = computed(() => (focusRecords.value[0] ?? records[0]!).activity.name)

	const outcomeLine = computed(() => {
		const { plannedFocusPeriods, completedFocusPeriods, outcome } = session
		if (plannedFocusPeriods === null || completedFocusPeriods === null) return null
		return t(
			`history.pomodoro.outcome.${outcome}`,
			{ done: completedFocusPeriods, total: plannedFocusPeriods },
			plannedFocusPeriods,
		)
	})
</script>

<style scoped>
	.time-column {
		width: 4rem;
		min-width: 4rem;
	}

	.line {
		border-width: 2px;
		min-width: 1rem !important;
	}
</style>

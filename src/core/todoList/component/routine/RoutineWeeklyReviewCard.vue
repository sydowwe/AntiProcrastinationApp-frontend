<template>
	<SubtleCard
		v-if="rows.length > 0"
		color="primary"
		icon="calendar-week"
		:title="$t('routineTodoList.review.title')"
		closable
		@close="close"
	>
		<p class="text-body-2 text-medium-emphasis mb-3">{{ $t('routineTodoList.review.subtitle') }}</p>
		<div class="d-flex flex-column ga-2">
			<div
				v-for="row in rows"
				:key="row.group.timePeriod.id"
				class="d-flex align-center flex-wrap ga-2 pa-2 rounded"
				style="background: rgba(var(--v-theme-neutral-700), 0.06)"
			>
				<VSheet
					:color="getBgColor(row.group.timePeriod.color)"
					width="10"
					height="10"
					rounded="circle"
					style="flex-shrink: 0"
				/>
				<span class="text-body-2 font-weight-bold">{{ row.group.timePeriod.text }}</span>
				<span class="text-caption text-medium-emphasis">
					{{
						row.total > 0
							? $t('routineTodoList.review.progressLastPeriod', { done: row.completed, total: row.total })
							: $t('routineTodoList.review.noDataLastPeriod')
					}}
				</span>
				<VSpacer />
				<div class="d-flex ga-1">
					<VBtn
						size="small"
						variant="text"
						color="secondaryOutline"
						@click="keep(row.group)"
					>
						{{ $t('routineTodoList.review.keep') }}
					</VBtn>
					<VBtn
						size="small"
						variant="tonal"
						color="secondaryOutline"
						@click="reduceFrequency(row.group)"
					>
						{{ $t('routineTodoList.review.reduceFrequency') }}
					</VBtn>
					<VBtn
						size="small"
						variant="outlined"
						color="secondaryOutline"
						@click="pause(row.group)"
					>
						{{ $t('routineTodoList.review.pause') }}
					</VBtn>
				</div>
			</div>
		</div>
	</SubtleCard>
</template>

<script setup lang="ts">
	import { computed, ref, watch } from 'vue'
	import { useI18n } from 'vue-i18n'
	import SubtleCard from '@/_common/component/feedback/SubtleCard.vue'
	import { useColor } from '@/_common/composable/general/useColor.ts'
	import { useDialog } from '@/_common/composable/general/useDialog.ts'
	import TimePeriodForm from '@/core/todoList/component/routine/dialog/TimePeriodForm.vue'
	import type { TimePeriodRequest } from '@/core/todoList/dto/request/TimePeriodRequest.ts'
	import type { RoutineTodoListGroupedList } from '@/core/todoList/dto/response/routine/RoutineTodoListGroupedList.ts'

	const { groups } = defineProps<{
		groups: RoutineTodoListGroupedList[]
	}>()

	const emit = defineEmits<{
		pause: [timePeriodId: number]
		reduceFrequency: [timePeriodId: number, request: TimePeriodRequest]
		dismissed: []
	}>()

	const { t } = useI18n()
	const { getBgColor } = useColor()
	const { openDialog } = useDialog()

	interface ReviewRow {
		group: RoutineTodoListGroupedList
		completed: number
		total: number
	}

	const handledIds = ref(new Set<number>())

	function ratio(row: ReviewRow): number {
		return row.total === 0 ? 1 : row.completed / row.total
	}

	// Struggling routines surface first — this review exists for downward renegotiation, so the
	// routines that most need "reduce" or "pause" shouldn't be buried below the ones already doing fine.
	const rows = computed<ReviewRow[]>(() =>
		groups
			.filter(group => !handledIds.value.has(group.timePeriod.id))
			.map(group => {
				const history = group.timePeriod.completionHistory
				const latest = history.length > 0 ? history[history.length - 1] : null
				return {
					group,
					completed: latest ? latest.completedCount : group.timePeriod.totalPeriodsCompleted,
					total: latest ? latest.totalCount : group.timePeriod.totalPeriodsElapsed,
				}
			})
			.sort((a, b) => ratio(a) - ratio(b)),
	)

	// All rows handled is the same signal as the user closing the card by hand — either way, the
	// review is done for this week.
	watch(rows, newRows => {
		if (newRows.length === 0) emit('dismissed')
	})

	function keep(group: RoutineTodoListGroupedList) {
		handledIds.value.add(group.timePeriod.id)
	}

	function pause(group: RoutineTodoListGroupedList) {
		handledIds.value.add(group.timePeriod.id)
		emit('pause', group.timePeriod.id)
	}

	async function reduceFrequency(group: RoutineTodoListGroupedList) {
		const result = await openDialog<{ idToEdit: number | null; request: TimePeriodRequest }>({
			component: TimePeriodForm,
			componentProps: { entityToEdit: group.timePeriod },
			dialogProps: {
				title: t('routineTodoList.review.reduceFrequencyDialogTitle'),
				confirmBtnLabel: t('general.save'),
			},
		})
		if (!result) return
		handledIds.value.add(group.timePeriod.id)
		emit('reduceFrequency', group.timePeriod.id, result.request)
	}

	function close() {
		emit('dismissed')
	}
</script>

<template>
	<div
		class="mt-2 mb-1"
		style="display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 8px"
	>
		<!-- Left: streak + consistency -->
		<div class="mb-1 d-flex flex-column ga-1">
			<div
				v-if="timePeriod.streak > 0"
				class="d-flex align-center ga-1"
			>
				<VIcon
					icon="fire-flame-curved"
					size="15"
					:color="timePeriod.streak >= timePeriod.bestStreak ? 'warning' : undefined"
				/>
				<span class="text-body-2 font-weight-bold">{{ timePeriod.streak }}</span>
				<span class="text-caption opacity-60">/ {{ timePeriod.bestStreak }}</span>
			</div>
			<div class="d-flex align-center ga-2 flex-wrap">
				<VTooltip
					v-if="timePeriod.totalPeriodsElapsed > 0"
					:text="$t('routineTodoList.consistencyLegend')"
					location="bottom"
				>
					<template #activator="{ props: tooltipProps }">
						<span
							v-bind="tooltipProps"
							class="text-caption font-weight-bold"
							:class="consistencyColor"
							style="cursor: default"
						>
							{{ consistencyPct }}%
						</span>
					</template>
				</VTooltip>
				<VTooltip
					v-if="atRisk"
					:text="timePeriod.nextResetAt ? $t('routineTodoList.resetDate', { date: resetDateLabel }) : ''"
					:disabled="!timePeriod.nextResetAt"
					location="bottom"
				>
					<template #activator="{ props: tooltipProps }">
						<VChip
							v-bind="tooltipProps"
							color="warning"
							size="x-small"
							prependIcon="triangle-exclamation"
							class="text-black font-weight-bold"
						>
							{{ $t('routineTodoList.daysLeft', { days: daysUntilReset }) }}
						</VChip>
					</template>
				</VTooltip>
			</div>
		</div>

		<!-- Center: title -->
		<VSheet
			class="px-3 d-flex align-center ga-2"
			rounded
			:color="getBgColor(timePeriod.color)"
			style="cursor: default"
		>
			<VCardTitle class="px-0 py-0">{{ timePeriod.text }}</VCardTitle>
			<VChip
				size="x-small"
				variant="tonal"
				color="white"
				class="font-weight-bold"
			>
				{{ timePeriod.lengthInDays }}d
			</VChip>
		</VSheet>

		<!-- Right: placeholder for grid alignment -->
		<div></div>
	</div>
</template>
<script setup lang="ts">
	import { computed } from 'vue'
	import { useColor } from '@/utils/colorPalette.ts'
	import type { RoutineTimePeriodEntity } from '@/dtos/response/todoList/routine/RoutineTimePeriodEntity.ts'
	import type { RoutineTodoListItemEntity } from '@/dtos/response/todoList/routine/RoutineTodoListItemEntity.ts'

	const { timePeriod, items } = defineProps<{
		timePeriod: RoutineTimePeriodEntity
		items: RoutineTodoListItemEntity[]
	}>()

	const { getBgColor } = useColor()

	const resetDateLabel = computed(() => {
		if (!timePeriod.nextResetAt) return ''
		return new Date(timePeriod.nextResetAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
	})

	const consistencyPct = computed(() => {
		if (!timePeriod.totalPeriodsElapsed) return 0
		return Math.round((timePeriod.totalPeriodsCompleted / timePeriod.totalPeriodsElapsed) * 100)
	})

	const consistencyColor = computed(() => {
		const pct = consistencyPct.value
		if (pct >= 80) return 'text-success'
		if (pct >= 50) return 'text-warning'
		return 'text-error'
	})

	const daysUntilReset = computed(() => {
		if (!timePeriod.nextResetAt) return Infinity
		const ms = new Date(timePeriod.nextResetAt).getTime() - Date.now()
		return Math.ceil(ms / (1000 * 60 * 60 * 24))
	})

	const atRisk = computed(() => {
		if (timePeriod.lengthInDays === 1) return false
		const days = daysUntilReset.value
		if (days > 1 || days < 0) return false
		const done = items.reduce((sum, item) => sum + (item.doneCount ?? (item.isDone ? 1 : 0)), 0)
		const total = items.reduce((sum, item) => sum + (item.totalCount ?? 1), 0)
		const pct = total ? (done / total) * 100 : 0
		return pct < timePeriod.streakThreshold
	})
</script>

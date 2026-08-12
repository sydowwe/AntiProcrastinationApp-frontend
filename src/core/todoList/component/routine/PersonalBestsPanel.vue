<template>
	<section v-if="sorted.length > 0">
		<h3 class="mb-3">{{ $t('routineTodoList.routinesOverTime') }}</h3>
		<div class="personal-bests-grid">
			<VCard
				v-for="p in sorted"
				:key="p.id"
				class="pa-3"
				rounded="lg"
			>
				<div class="d-flex align-center ga-2 mb-2">
					<VSheet
						:color="getBgColor(p.color)"
						width="12"
						height="12"
						rounded="circle"
						style="flex-shrink: 0"
					/>
					<span class="text-body-2 font-weight-bold text-truncate">{{ p.text }}</span>
				</div>

				<VDivider class="mb-2" />

				<div class="d-flex ga-3">
					<VTooltip
						:text="
							$t('routineTodoList.longestRunWithCount', {
								run: countLabel(p.bestStreak, p.lengthInDays),
							})
						"
						location="bottom"
					>
						<template #activator="{ props: tip }">
							<div
								v-bind="tip"
								class="d-flex align-center ga-1"
								style="cursor: default"
							>
								<VIcon
									icon="arrow-trend-up"
									size="14"
									:color="p.streak === p.bestStreak && p.streak > 0 ? 'warning' : undefined"
								/>
								<span
									class="text-body-2 font-weight-bold"
									:class="p.streak === p.bestStreak && p.streak > 0 ? 'text-warning' : ''"
								>
									{{ p.bestStreak }}
								</span>
							</div>
						</template>
					</VTooltip>

					<VTooltip
						:text="$t('routineTodoList.currentRunWithCount', { run: runLabel(p.streak, p.lengthInDays) })"
						location="bottom"
					>
						<template #activator="{ props: tip }">
							<div
								v-bind="tip"
								class="d-flex align-center ga-1"
								style="cursor: default"
							>
								<VIcon
									icon="fire-flame-curved"
									size="14"
									:color="p.streak > 0 ? 'orange' : undefined"
								/>
								<span class="text-body-2">{{ p.streak }}</span>
							</div>
						</template>
					</VTooltip>

					<VTooltip
						:text="$t('routineTodoList.consistencyLegend')"
						location="bottom"
					>
						<template #activator="{ props: tip }">
							<div
								v-bind="tip"
								class="d-flex align-center ga-1"
								style="cursor: default"
							>
								<VIcon
									icon="chart-line"
									size="14"
								/>
								<span
									class="text-body-2 font-weight-bold"
									:class="consistencyColor(p)"
								>
									{{ consistencyPct(p) }}%
								</span>
							</div>
						</template>
					</VTooltip>

					<div class="d-flex align-center ga-1 ml-auto">
						<VIcon
							icon="calendar-days"
							size="14"
							class="opacity-60"
						/>
						<span class="text-caption opacity-60">{{ p.lengthInDays }}d</span>
					</div>
				</div>
			</VCard>
		</div>
	</section>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import type { RoutineTimePeriodEntity } from '@/core/todoList/dto/response/routine/RoutineTimePeriodEntity.ts'
	import { useColor } from '@/_common/composable/general/useColor.ts'
	import { useRoutineRunLabel } from '@/core/todoList/composable/useRoutineRunLabel.ts'

	const { timePeriods } = defineProps<{ timePeriods: RoutineTimePeriodEntity[] }>()

	const { getBgColor } = useColor()
	const { runLabel, countLabel } = useRoutineRunLabel()

	// Ordered by name, not by rank — ranking your own routines against each other carries no information.
	const sorted = computed(() =>
		timePeriods
			.filter(p => p.totalPeriodsElapsed > 0)
			.slice()
			.sort((a, b) => (a.text ?? '').localeCompare(b.text ?? '')),
	)

	function consistencyPct(p: RoutineTimePeriodEntity): number {
		if (!p.totalPeriodsElapsed) return 0
		return Math.round((p.totalPeriodsCompleted / p.totalPeriodsElapsed) * 100)
	}

	function consistencyColor(p: RoutineTimePeriodEntity): string {
		return consistencyPct(p) >= 80 ? 'text-success' : 'text-medium-emphasis'
	}
</script>

<style scoped>
	.personal-bests-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
		gap: 12px;
	}
</style>

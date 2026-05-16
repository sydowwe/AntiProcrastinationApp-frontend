<template>
	<section v-if="sorted.length > 0">
		<h3 class="mb-3">{{ $t('routineTodoList.personalBests') }}</h3>
		<div class="personal-bests-grid">
			<VCard
				v-for="(p, i) in sorted"
				:key="p.id"
				class="pa-3 position-relative"
				rounded="lg"
			>
				<VChip
					v-if="i < 3"
					class="rank-badge"
					size="x-small"
					:style="{ backgroundColor: rankColor(i), color: '#000' }"
				>
					#{{ i + 1 }}
				</VChip>

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
					<VTooltip :text="$t('routineTodoList.bestStreak')" location="bottom">
						<template #activator="{ props: tip }">
							<div
								v-bind="tip"
								class="d-flex align-center ga-1"
								style="cursor: default"
							>
								<VIcon
									:icon="milestoneIcon(p.bestStreak) ?? 'trophy'"
									size="14"
									:color="p.streak === p.bestStreak && p.streak > 0 ? 'warning' : undefined"
								/>
								<span
									class="text-body-2 font-weight-bold"
									:class="p.streak === p.bestStreak && p.streak > 0 ? 'text-warning' : ''"
								>{{ p.bestStreak }}</span>
							</div>
						</template>
					</VTooltip>

					<VTooltip :text="$t('routineTodoList.streaks')" location="bottom">
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

					<VTooltip :text="$t('routineTodoList.consistencyLegend')" location="bottom">
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
								>{{ consistencyPct(p) }}%</span>
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
	import type { RoutineTimePeriodEntity } from '@/dtos/response/todoList/routine/RoutineTimePeriodEntity.ts'
	import { useColor } from '@/utils/colorPalette.ts'

	const { timePeriods } = defineProps<{ timePeriods: RoutineTimePeriodEntity[] }>()

	const { getBgColor } = useColor()

	const sorted = computed(() =>
		timePeriods
			.filter(p => p.totalPeriodsElapsed > 0)
			.slice()
			.sort((a, b) => b.bestStreak - a.bestStreak),
	)

	function milestoneIcon(streak: number): string | null {
		if (streak >= 365) return 'crown'
		if (streak >= 180) return 'gem'
		if (streak >= 90) return 'trophy'
		if (streak >= 30) return 'star'
		if (streak >= 7) return 'fire-flame-curved'
		return null
	}

	function consistencyPct(p: RoutineTimePeriodEntity): number {
		if (!p.totalPeriodsElapsed) return 0
		return Math.round((p.totalPeriodsCompleted / p.totalPeriodsElapsed) * 100)
	}

	function consistencyColor(p: RoutineTimePeriodEntity): string {
		const pct = consistencyPct(p)
		if (pct >= 80) return 'text-success'
		if (pct >= 50) return 'text-warning'
		return 'text-error'
	}

	const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32']

	function rankColor(index: number): string {
		return rankColors[index] ?? ''
	}
</script>

<style scoped>
	.personal-bests-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
		gap: 12px;
	}

	.rank-badge {
		position: absolute;
		top: 8px;
		right: 8px;
		font-weight: 700;
	}
</style>

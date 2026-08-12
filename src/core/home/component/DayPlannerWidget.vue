<template>
	<VCard style="display: flex; flex-direction: column">
		<VCardTitle class="d-flex align-center ga-3 px-4 pt-4 pb-3">
			<VAvatar
				color="primary"
				variant="tonal"
				rounded="lg"
				size="38"
			>
				<VIcon icon="fa-calendar-day" />
			</VAvatar>
			<div
				class="d-flex flex-column"
				style="line-height: 1.15"
			>
				<span class="text-h6">{{ $t('home.dayPlanner') }}</span>
			</div>
			<VSpacer />
			<VChip
				v-if="streakStore.displayedStreak > 0"
				color="warning"
				variant="tonal"
				size="small"
				prependIcon="fas fa-fire"
				:title="$t('home.bestStreak') + ': ' + streakStore.best"
			>
				{{ streakStore.displayedStreak }}
			</VChip>
			<VChip
				v-if="missedTasks.length > 0"
				color="error"
				variant="tonal"
				size="small"
				prependIcon="fa-triangle-exclamation"
			>
				{{ missedTasks.length }}
			</VChip>
			<VProgressCircular
				v-if="calendar && totalCount > 0"
				:modelValue="progressPercent"
				:color="progressPercent === 100 ? 'success' : 'primary'"
				:size="42"
				:width="5"
			>
				<span class="text-caption font-weight-bold">{{ completedCount }}/{{ totalCount }}</span>
			</VProgressCircular>
			<VIconBtn
				icon="fa-up-right-from-square"
				variant="text"
				size="small"
				@click="openPlanner"
			/>
		</VCardTitle>
		<!-- a background refetch says so in 2px instead of tearing the list down to a spinner -->
		<VProgressLinear
			v-if="refreshing"
			indeterminate
			color="primary"
			height="2"
		/>
		<VDivider v-else />
		<VCardText
			class="pa-0"
			style="flex: 1; overflow-y: auto; min-height: 0"
		>
			<div
				v-if="loading"
				class="d-flex justify-center align-center h-100"
			>
				<VProgressCircular indeterminate />
			</div>

			<div
				v-else-if="!calendar"
				class="d-flex flex-column align-center justify-center ga-3 h-100 pa-4"
			>
				<VIcon
					icon="fa-calendar-plus"
					size="42"
					class="text-medium-emphasis"
					style="opacity: 0.4"
				/>
				<span class="text-medium-emphasis">{{ $t('home.noCalendar') }}</span>
				<VBtn
					color="primary"
					prependIcon="fa-wand-magic-sparkles"
					@click="openPlanner"
				>
					{{ $t('home.planToday') }}
				</VBtn>
			</div>

			<div
				v-else-if="sortedTasks.length === 0"
				class="d-flex flex-column align-center justify-center ga-3 py-8 text-medium-emphasis"
			>
				<VIcon
					icon="fa-mug-hot"
					size="36"
					style="opacity: 0.4"
				/>
				<span>{{ $t('home.noTasks') }}</span>
			</div>

			<template v-else>
				<!-- whole day at a glance, with the part you have already spent greyed out -->
				<div class="px-4 pt-3">
					<div class="daystrip">
						<div
							class="daystrip__elapsed"
							:style="{ width: elapsedWidth }"
						/>
						<div
							v-for="task in sortedTasks"
							:key="task.id"
							class="daystrip__seg"
							:class="{ 'daystrip__seg--done': isFinished(task) }"
							:style="{
								left: stripLeft(task),
								width: stripWidth(task),
								background: taskColor(task),
							}"
							:title="`${task.startTime.getString()} ${task.activity.name}`"
						/>
						<div
							v-if="nowInsideDay"
							class="daystrip__now"
							:style="{ left: nowLeft }"
						/>
					</div>
					<div class="d-flex justify-space-between mt-1">
						<span class="text-caption text-medium-emphasis">{{ dayStartLabel }}</span>
						<span class="text-caption font-weight-medium">{{ remainingLabel }}</span>
						<span class="text-caption text-medium-emphasis">{{ dayEndLabel }}</span>
					</div>
				</div>

				<!-- the one thing to look at -->
				<div
					v-if="focusTask"
					class="focus mx-3 mt-3"
					:class="{ 'focus--missed': focusMode === 'missed' }"
					:style="{ '--task-color': taskColor(focusTask) }"
				>
					<div class="d-flex align-center ga-2 mb-1">
						<VIcon
							:icon="focusIcon"
							size="11"
						/>
						<span class="focus__kicker">{{ $t(`home.${focusMode}`) }}</span>
						<VSpacer />
						<span
							v-if="overrunMinutes > 0"
							class="text-caption font-weight-bold text-error"
						>
							{{ $t('home.overrunBy', { time: minutesLabel(overrunMinutes) }) }}
						</span>
						<span
							v-else
							class="text-caption font-weight-bold"
						>
							{{ focusCountdown }}
						</span>
					</div>
					<div class="d-flex align-center ga-3">
						<button
							type="button"
							class="check check--lg"
							:class="{ 'check--on': isFinished(focusTask) }"
							@click.stop="toggleTaskStatus(focusTask)"
						>
							<VIcon
								icon="fa-check"
								size="16"
							/>
						</button>
						<div
							class="flex-grow-1"
							style="min-width: 0"
						>
							<div class="focus__title">{{ focusTask.activity.name }}</div>
							<div class="text-caption text-medium-emphasis">
								{{ focusTask.startTime.getString() }} – {{ focusTask.endTime.getString() }} ·
								{{ durationLabel(focusTask) }}
							</div>
						</div>
						<VBtn
							v-if="focusMode === 'now'"
							variant="tonal"
							color="primaryOutline"
							size="small"
							prependIcon="fa-hourglass-half"
							@click="extendTask(focusTask, 15)"
						>
							+15m
						</VBtn>
						<VBtn
							v-else
							color="primary"
							size="small"
							prependIcon="fa-play"
							@click="startTask(focusTask)"
						>
							{{ $t('home.start') }}
						</VBtn>
					</div>
					<VProgressLinear
						v-if="focusMode === 'now'"
						:modelValue="activeProgress"
						:color="overrunMinutes > 0 ? 'error' : 'var(--task-color)'"
						height="6"
						rounded
						class="mt-2"
					/>
				</div>
				<div
					v-else
					class="focus focus--done mx-3 mt-3 d-flex align-center ga-3"
				>
					<VIcon
						icon="fa-champagne-glasses"
						size="22"
						color="success"
					/>
					<span class="text-body-2 font-weight-medium">{{ $t('home.allDoneLong') }}</span>
				</div>

				<!-- the rest of the day -->
				<div
					class="pa-3"
					v-auto-animate
				>
					<template
						v-for="(task, index) in sortedTasks"
						:key="task.id"
					>
						<div
							v-if="gapBefore(index) > 0"
							class="gap"
						>
							<span class="gap__dash" />
							<span class="gap__label">{{ minutesLabel(gapBefore(index)) }}</span>
							<span class="gap__dash" />
						</div>
						<div
							class="row"
							:class="{
								'row--active': isActive(task),
								'row--done': isFinished(task),
								'row--missed': isMissed(task),
							}"
							:style="{ '--task-color': taskColor(task) }"
						>
							<button
								type="button"
								class="check"
								:class="{ 'check--on': isFinished(task) }"
								@click.stop="toggleTaskStatus(task)"
							>
								<VIcon
									icon="fa-check"
									size="13"
								/>
							</button>
							<div class="row__time">
								<span class="row__time-start">{{ task.startTime.getString() }}</span>
								<span class="row__time-end">{{ task.endTime.getString() }}</span>
							</div>
							<div class="row__body">
								<span class="row__title">{{ task.activity.name }}</span>
								<div
									v-if="task.activity.category || showStatusChip(task)"
									class="d-flex align-center ga-2 mt-1"
								>
									<!-- colour here means "which category", never "how urgent" -->
									<VChip
										v-if="task.activity.category"
										size="x-small"
										density="compact"
										variant="tonal"
										:color="task.activity.category.color ?? undefined"
										:prependIcon="task.activity.category.icon ?? undefined"
									>
										{{ task.activity.category.name }}
									</VChip>
									<VChip
										v-if="showStatusChip(task)"
										size="x-small"
										density="compact"
										variant="tonal"
										:prependIcon="getPlannerTaskStatusIcon(task.status)"
									>
										{{ $t('planner.status.' + task.status) }}
									</VChip>
								</div>
							</div>
							<span class="row__duration text-caption">{{ durationLabel(task) }}</span>
							<!-- a plan you can repair is a plan you keep using -->
							<VMenu
								v-if="!isFinished(task)"
								location="bottom end"
							>
								<template #activator="{ props: menuProps }">
									<VIconBtn
										v-bind="menuProps"
										icon="fa-ellipsis-vertical"
										variant="text"
										size="x-small"
										@click.stop
									/>
								</template>
								<VList density="compact">
									<VListItem
										prependIcon="fa-play"
										:title="$t('home.start')"
										@click="startTask(task)"
									/>
									<VDivider class="my-1" />
									<VListSubheader>{{ $t('home.moveLater') }}</VListSubheader>
									<VListItem
										v-for="minutes in snoozeOptions"
										:key="minutes"
										:title="`+${minutesLabel(minutes)}`"
										prependIcon="fa-clock-rotate-left"
										@click="snoozeTask(task, minutes)"
									/>
									<VDivider class="my-1" />
									<VListSubheader>{{ $t('home.skip') }}</VListSubheader>
									<VListItem
										v-for="reason in skipReasons"
										:key="reason"
										:title="$t(`home.skipReason.${reason}`)"
										prependIcon="fa-forward"
										@click="skipTask(task, $t(`home.skipReason.${reason}`))"
									/>
								</VList>
							</VMenu>
						</div>
					</template>
				</div>
			</template>
		</VCardText>
	</VCard>
</template>

<script setup lang="ts">
	import { computed, onMounted } from 'vue'
	import { useRouter } from 'vue-router'
	import { useI18n } from 'vue-i18n'
	import type { PlannerTask } from '@/core/dayPlanner/dto/response/PlannerTask.ts'
	import { getPlannerTaskStatusIcon, PlannerTaskStatus } from '@/core/dayPlanner/dto/enum/PlannerTaskStatus.ts'
	import { Time } from '@/_common/dto/dto/Time.ts'
	import { useTodayPlan } from '@/core/home/composable/useTodayPlan.ts'

	const router = useRouter()
	const { t } = useI18n()
	const {
		calendar,
		loading,
		refreshing,
		nowMinutes,
		sortedTasks,
		totalCount,
		completedCount,
		progressPercent,
		activeTask,
		nextTask,
		lastMissedTask,
		missedTasks,
		focusTask,
		focusMode,
		activeProgress,
		overrunMinutes,
		todayUrlDate,
		streakStore,
		isActive,
		isMissed,
		isFinished,
		taskColor,
		minutesLabel,
		durationLabel,
		toggleTaskStatus,
		startTask,
		skipTask,
		snoozeTask,
		extendTask,
		ensureLoaded,
	} = useTodayPlan()

	const snoozeOptions = [15, 30, 60]
	const skipReasons = ['noTime', 'notRelevant', 'noEnergy'] as const

	// --- day strip -------------------------------------------------------------
	const dayStart = computed(() =>
		sortedTasks.value.length === 0 ? 0 : Math.floor(sortedTasks.value[0]!.startTime.getInMinutes / 60) * 60,
	)
	const dayEnd = computed(() => {
		const latest = Math.max(...sortedTasks.value.map(task => task.endTime.getInMinutes))
		return Math.min(Math.ceil(latest / 60) * 60, 24 * 60)
	})
	const daySpan = computed(() => Math.max(dayEnd.value - dayStart.value, 1))
	const dayStartLabel = computed(() => Time.fromMinutes(dayStart.value).getString())
	const dayEndLabel = computed(() => Time.fromMinutes(dayEnd.value).getString())
	const nowInsideDay = computed(() => nowMinutes.value >= dayStart.value && nowMinutes.value <= dayEnd.value)
	const nowLeft = computed(() => percent(nowMinutes.value - dayStart.value))
	const elapsedWidth = computed(() =>
		percent(Math.min(Math.max(nowMinutes.value - dayStart.value, 0), daySpan.value)),
	)
	// Time blindness: say how much of the plan is left, do not make it be inferred from the clock.
	const remainingLabel = computed(() => {
		const left = dayEnd.value - nowMinutes.value
		return left <= 0 ? t('home.planOver') : t('home.leftOfPlan', { time: minutesLabel(left) })
	})

	function percent(minutes: number): string {
		return `${(minutes / daySpan.value) * 100}%`
	}

	function stripLeft(task: PlannerTask): string {
		return percent(task.startTime.getInMinutes - dayStart.value)
	}

	function stripWidth(task: PlannerTask): string {
		return `max(3px, ${percent(task.endTime.getInMinutes - task.startTime.getInMinutes)})`
	}

	// --- focus block -----------------------------------------------------------
	const focusIcon = computed(() => {
		switch (focusMode.value) {
			case 'now':
				return 'fa-play'
			case 'upNext':
				return 'fa-forward'
			default:
				return 'fa-triangle-exclamation'
		}
	})
	const focusCountdown = computed(() => {
		if (activeTask.value) {
			return t('home.endsIn', { time: minutesLabel(activeTask.value.endTime.getInMinutes - nowMinutes.value) })
		}
		if (nextTask.value) {
			return t('home.startsIn', { time: minutesLabel(nextTask.value.startTime.getInMinutes - nowMinutes.value) })
		}
		if (lastMissedTask.value) {
			return t('home.wasDue', {
				time: minutesLabel(nowMinutes.value - lastMissedTask.value.endTime.getInMinutes),
			})
		}
		return ''
	})

	function gapBefore(index: number): number {
		if (index === 0) return 0
		return sortedTasks.value[index]!.startTime.getInMinutes - sortedTasks.value[index - 1]!.endTime.getInMinutes
	}

	/** Done and not-started are already obvious from the tick and the strike-through. */
	function showStatusChip(task: PlannerTask): boolean {
		return task.status === PlannerTaskStatus.InProgress || task.status === PlannerTaskStatus.OnHold
	}

	function openPlanner() {
		router.push({ name: 'dayPlanner', params: { date: todayUrlDate.value } })
	}

	onMounted(ensureLoaded)
</script>

<style scoped>
	/* ---- day at a glance ---- */
	.daystrip {
		position: relative;
		height: 14px;
		border-radius: 7px;
		background: rgba(var(--v-theme-on-surface), 0.07);
		overflow: hidden;
	}

	.daystrip__elapsed {
		position: absolute;
		top: 0;
		bottom: 0;
		left: 0;
		background: rgba(var(--v-theme-on-surface), 0.14);
	}

	.daystrip__seg {
		position: absolute;
		top: 0;
		bottom: 0;
		border-radius: 7px;
		opacity: 0.85;
	}

	.daystrip__seg--done {
		opacity: 0.3;
	}

	.daystrip__now {
		position: absolute;
		top: -3px;
		bottom: -3px;
		width: 2px;
		background: rgb(var(--v-theme-error));
		box-shadow: 0 0 6px 1px rgb(var(--v-theme-error));
	}

	/* ---- focus block ---- */
	.focus {
		border-radius: 14px;
		padding: 12px 14px;
		border: 1px solid var(--task-color);
		background: linear-gradient(
			180deg,
			rgba(var(--v-theme-on-surface), 0.06),
			rgba(var(--v-theme-on-surface), 0.02)
		);
		color: var(--task-color);
	}

	.focus--missed {
		border-color: rgb(var(--v-theme-error));
		color: rgb(var(--v-theme-error));
	}

	.focus--done {
		border-color: rgba(var(--v-theme-success), 0.6);
		color: rgb(var(--v-theme-on-surface));
	}

	.focus__kicker {
		font-size: 0.68rem;
		font-weight: 800;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	.focus__title {
		font-size: 1.05rem;
		font-weight: 700;
		color: rgb(var(--v-theme-on-surface));
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* ---- rows ---- */
	.row {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 8px 6px 8px 12px;
		margin-bottom: 6px;
		border-radius: 12px;
		background: rgba(var(--v-theme-on-surface), 0.04);
		transition:
			background-color 0.15s ease,
			opacity 0.15s ease;
	}

	.row:hover {
		background: rgba(var(--v-theme-on-surface), 0.09);
	}

	.row--active {
		background: color-mix(in srgb, var(--task-color) 18%, transparent);
	}

	.row--missed {
		background: rgba(var(--v-theme-error), 0.1);
	}

	.row--done {
		opacity: 0.45;
	}

	.row--done .row__title {
		text-decoration: line-through;
	}

	.row__time {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		line-height: 1.15;
		flex: 0 0 auto;
	}

	.row__time-start {
		font-size: 0.85rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}

	.row__time-end {
		font-size: 0.68rem;
		opacity: 0.5;
		font-variant-numeric: tabular-nums;
	}

	.row__body {
		flex: 1;
		min-width: 0;
	}

	.row__title {
		display: block;
		font-size: 0.95rem;
		font-weight: 600;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.row__duration {
		flex: 0 0 auto;
		opacity: 0.5;
		font-variant-numeric: tabular-nums;
	}

	/* ---- big tap target checkbox ---- */
	.check {
		flex: 0 0 auto;
		width: 26px;
		height: 26px;
		border-radius: 50%;
		border: 2px solid var(--task-color);
		background: transparent;
		color: transparent;
		display: flex;
		align-items: center;
		justify-content: center;
		transition:
			background-color 0.15s ease,
			color 0.15s ease,
			transform 0.12s ease;
	}

	.check--lg {
		width: 36px;
		height: 36px;
	}

	.check:hover {
		transform: scale(1.12);
		color: var(--task-color);
	}

	.check--on {
		background: var(--task-color);
		color: rgb(var(--v-theme-surface));
	}

	/* ---- free time between tasks ---- */
	.gap {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 0 12px;
		margin-bottom: 6px;
		opacity: 0.35;
	}

	.gap__dash {
		flex: 1;
		border-top: 2px dashed currentColor;
	}

	.gap__label {
		font-size: 0.68rem;
		font-variant-numeric: tabular-nums;
	}
</style>

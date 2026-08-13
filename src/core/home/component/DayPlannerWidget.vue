<!--
	The day's list, and nothing about "right now". NowBar owns the focus task — see the decision
	recorded in its header comment. This card used to render a second copy of it, which is why the
	focus block, its icon switch and its countdown are gone from here rather than merely tidied.

	Deliberately NOT built on WidgetCard, unlike the other four home widgets.

	Fitting it would have cost the shell three things nothing else needs: a leading-avatar slot, a
	`refreshing` flag to swap the divider for the 2px bar, and a way to turn the body padding off
	(everything below manages its own insets). Its empty state is also two different blocks — "no
	calendar yet, plan one" and "calendar exists but is empty" — where the shell models one.

	Three escape hatches for a single caller is a worse shell than one honest duplicate, so this
	keeps its own frame.

	H7 resolved the third of those: `refreshing` is now a WidgetCard prop, rendered there the same
	way it is rendered here. The other two — the leading avatar and the two-branch empty state — are
	unchanged, so this still does not fit the shell. Revisit if either of them goes.
-->
<template>
	<VCard class="planner-card">
		<VCardTitle class="planner-card__header d-flex align-center ga-3 px-4 pt-4 pb-2">
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
			<!-- rendered as-is: a broken streak already arrives as 0 -->
			<VChip
				v-if="streak.currentStreak > 0"
				color="warning"
				variant="tonal"
				size="small"
				prependIcon="fas fa-fire"
				:title="$t('home.bestStreak') + ': ' + streak.bestStreak"
			>
				{{ streak.currentStreak }}
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
				v-if="hasPlan && totalCount > 0"
				:modelValue="progressPercent"
				:color="progressPercent === 100 ? 'success' : 'primary'"
				:size="42"
				:width="5"
			>
				<span class="text-caption font-weight-bold">{{ completedCount }}/{{ totalCount }}</span>
			</VProgressCircular>
			<!-- Same accessible name the shell renders for the other four widgets; this one keeps its
				 own frame (see the note at the top), so it repeats the two attributes. -->
			<VIconBtn
				icon="fa-up-right-from-square"
				variant="text"
				size="small"
				:title="openTitle"
				:aria-label="openLabel"
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
		<VCardText class="planner-card__body pa-0">
			<div
				v-if="loading"
				class="d-flex justify-center align-center h-100"
			>
				<VProgressCircular indeterminate />
			</div>

			<div
				v-else-if="error"
				class="d-flex flex-column align-center justify-center ga-3 h-100 pa-4 text-center text-medium-emphasis"
			>
				<VIcon
					icon="fa-triangle-exclamation"
					size="32"
					style="opacity: 0.4"
				/>
				<span>{{ $t('home.loadFailedPlan') }}</span>
				<VBtn
					variant="tonal"
					color="primaryOutline"
					prependIcon="fa-rotate-right"
					@click="reload"
				>
					{{ $t('home.retry') }}
				</VBtn>
			</div>

			<!-- `hasPlan`, not the calendar: calendars are seeded for whole years, so its presence
				 answers "is this date inside the seeded window", never "did the user plan this day". -->
			<div
				v-else-if="!hasPlan"
				class="d-flex flex-column align-center justify-center ga-3 h-100 pa-4"
			>
				<VIcon
					icon="fa-calendar-plus"
					size="42"
					class="text-medium-emphasis"
					style="opacity: 0.4"
				/>
				<span class="text-medium-emphasis">{{ $t('home.noPlanToday') }}</span>
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
				<DayStrip class="px-4 pt-3" />

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
							<!-- A bare `<button>` with an icon inside is announced as "button" and nothing
								 else. `aria-pressed` carries the state the fill colour carries visually. -->
							<button
								type="button"
								class="check"
								:class="{ 'check--on': isFinished(task) }"
								:aria-label="$t('home.markDone', { task: task.activity.name })"
								:aria-pressed="isFinished(task)"
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
									v-if="task.activity.category || showStatusChip(task) || isMissed(task)"
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
									<!-- Missed is otherwise a red tint on the row and nothing else — meaning
										 carried by colour alone, which a screen reader and a good share of
										 colour-blind users never receive. -->
									<VChip
										v-if="isMissed(task)"
										size="x-small"
										density="compact"
										variant="tonal"
										color="error"
										prependIcon="fa-triangle-exclamation"
									>
										{{ $t('home.missed') }}
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
							<TaskActionMenu
								:task
								size="x-small"
							/>
						</div>
					</template>
				</div>
			</template>
		</VCardText>
	</VCard>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import { useRouter } from 'vue-router'
	import { useI18n } from 'vue-i18n'
	import type { PlannerTask } from '@/core/dayPlanner/dto/response/PlannerTask.ts'
	import { getPlannerTaskStatusIcon, PlannerTaskStatus } from '@/core/dayPlanner/dto/enum/PlannerTaskStatus.ts'
	import { useTodayPlan } from '@/core/home/composable/useTodayPlan.ts'
	import { HOME_SHORTCUT_KEYS, withShortcut } from '@/core/home/composable/useHomeShortcuts.ts'
	import DayStrip from '@/core/home/component/DayStrip.vue'
	import TaskActionMenu from '@/core/home/component/TaskActionMenu.vue'

	const router = useRouter()
	const { t } = useI18n()
	const {
		hasPlan,
		loading,
		refreshing,
		error,
		sortedTasks,
		totalCount,
		completedCount,
		progressPercent,
		missedTasks,
		todayUrlDate,
		streak,
		isActive,
		isMissed,
		isFinished,
		taskColor,
		minutesLabel,
		durationLabel,
		toggleTaskStatus,
		reload,
	} = useTodayPlan()

	const openLabel = computed(() => t('home.openFullView', { widget: t('home.dayPlanner') }))
	// The keyboard shortcut goes in the tooltip, not in the accessible name: the name should say what
	// the button does, and a screen-reader user is told the key once, not on every focus.
	const openTitle = computed(() => withShortcut(openLabel.value, HOME_SHORTCUT_KEYS.planner))

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
</script>

<style scoped>
	/*
	 * ---- the frame ----
	 *
	 * The same two-breakpoint story as WidgetCard, which this card deliberately does not use (see the
	 * note at the top of the file). Below `md` the card has no definite height to divide — HomeView
	 * stops handing one down so the page can scroll instead of every card scrolling inside itself —
	 * so the body takes its content height. `flex: 1` here would collapse it to a header and nothing.
	 */
	.planner-card {
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	/* Wraps below `md` only: above it, cards side by side keep their headers the same height. */
	.planner-card__header {
		flex: 0 0 auto;
		flex-wrap: wrap;
		row-gap: 8px;
	}

	.planner-card__body {
		flex: 0 0 auto;
		min-height: 7rem;
		overflow: visible;
	}

	@media (min-width: 960px) {
		.planner-card__header {
			flex-wrap: nowrap;
		}

		.planner-card__body {
			flex: 1;
			min-height: 0;
			overflow-y: auto;
		}
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

	/*
	 * 0.45 put the row's own 0.68rem text below AA. 0.6 still reads as "handled, stop looking at it"
	 * — the line-through is what actually says done — while keeping the text legible for anyone who
	 * does want to re-read it.
	 */
	.row--done {
		opacity: 0.6;
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

	.check:hover {
		transform: scale(1.12);
		color: var(--task-color);
	}

	/*
	 * A custom-styled `<button>` keeps the UA focus ring only until something sets `border` or
	 * `background` on it — which the rules above do. Restated explicitly, in the page's text colour rather
	 * than the task's own, so it stays visible on a tinted row and on a pale task colour.
	 */
	.check:focus-visible {
		outline: 2px solid rgb(var(--v-theme-on-surface));
		outline-offset: 2px;
	}

	.check--on {
		background: var(--task-color);
		color: rgb(var(--v-theme-surface));
	}

	/*
	 * ---- free time between tasks ----
	 *
	 * The opacity used to be on the whole row, which took 0.68rem text down to 0.35 — nowhere near
	 * AA. The dashes may be that faint (they are decoration and carry no information the label does
	 * not), the label may not: it is the only place the length of the gap is written.
	 */
	.gap {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 0 12px;
		margin-bottom: 6px;
	}

	.gap__dash {
		flex: 1;
		border-top: 2px dashed currentColor;
		opacity: 0.35;
	}

	.gap__label {
		font-size: 0.72rem;
		font-variant-numeric: tabular-nums;
		opacity: 0.75;
	}
</style>

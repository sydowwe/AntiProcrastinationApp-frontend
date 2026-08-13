import { computed, effectScope, ref, watch } from 'vue'
import type { Ref } from 'vue'
import { useCalendarQuery } from '@/core/activityHistory/api/calendarApi.ts'
import { useTaskPlannerCrud } from '@/core/dayPlanner/api/plannerTaskApi.ts'
import type { Calendar } from '@/core/dayPlanner/dto/response/Calendar.ts'
import type { PlannerTask } from '@/core/dayPlanner/dto/response/PlannerTask.ts'
import { PlannerTaskFilter } from '@/core/dayPlanner/dto/request/PlannerTaskFilter.ts'
import { PlannerTaskRequest } from '@/core/dayPlanner/dto/request/PlannerTaskRequest.ts'
import { PatchPlannerTaskStatusRequest } from '@/core/dayPlanner/dto/request/PatchPlannerTaskStatusRequest.ts'
import { PlannerTaskStatus } from '@/core/dayPlanner/dto/enum/PlannerTaskStatus.ts'
import { Time } from '@/_common/dto/dto/Time.ts'
import { usStringToUrlString } from '@/_common/utils/DateTimeHelper.ts'
import { useCurrentTime } from '@/_common/composable/general/useCurrentTime.ts'
import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
import { showNotification } from '@/_common/utils/notifications.ts'
import { useUserStore } from '@/_common/modules/user/store/authStore.ts'
import { usePlannerStreakStore } from '@/core/home/store/plannerStreakStore.ts'
import { todayIsoDate, useDashboardRefresh } from '@/core/home/composable/useDashboardRefresh.ts'
import i18n from '@/i18n.ts'

export type FocusMode = 'now' | 'upNext' | 'missed' | 'allDone'

/** Minutes before a task starts that the "get ready" warning fires. */
export const TRANSITION_WARNING_MINUTES = 10

// Module-level state: the now bar and the planner widget are two views of one plan, so they share
// one fetch and one set of derived values instead of drifting apart.
//
// Everything module-level needs a lifecycle to match, or it outlives the session that produced it.
// That lifecycle is `planScope` at the bottom of this file: one detached effect scope that owns the
// clock mirror, the alert watcher, the midnight rollover and the sign-in/sign-out reset. It is
// deliberately NOT bound to a component — a watcher created inside whichever widget happened to
// call first dies when that widget unmounts while the module state lives on.
const calendar = ref<Calendar | null>(null)
const tasks = ref<PlannerTask[]>([])
/** True only while nothing is on screen yet — widgets render this as a spinner. */
const loading = ref(true)
/** True during a background refetch, with the previous plan still rendered underneath. */
const refreshing = ref(false)
/**
 * True when the most recent `fetchPlan()` failed. Deliberately a plain ref rather than
 * `useRequestState()`: that composable ties `loading`/`error` to a raw server message and an
 * `_silent` flag for suppressing the axios interceptor's snackbar, but here the interceptor's
 * generic snackbar should keep firing (as it already does for every other request) while this
 * flag drives its own friendly, localized, per-consumer message — NowBar and DayPlannerWidget
 * each phrase it differently, which a shared server-text ref can't do.
 */
const error = ref(false)
const now = ref(new Date())
/** Local ISO date the loaded plan belongs to. Null means "nothing loaded". */
const planDate = ref<string | null>(null)

let loadPromise: Promise<void> | null = null
// Bumped on every fetch and on every reset, so a response that arrives after the plan it belongs to
// stopped being current (day rollover, user switch) is dropped instead of overwriting the new one.
let loadToken = 0
const firedAlerts = new Set<string>()

// The API composables are plain closures over `API`, but they allocate a request-state pair per
// call, so build them once for the module rather than on every command.
let plannerApi: ReturnType<typeof useTaskPlannerCrud> | null = null
let calendarApi: ReturnType<typeof useCalendarQuery> | null = null

function planner() {
	return (plannerApi ??= useTaskPlannerCrud())
}

function calendarQuery() {
	return (calendarApi ??= useCalendarQuery())
}

// --- date identity -----------------------------------------------------------
// Not captured at setup: this dashboard is left open overnight, and a frozen date sends every
// "open the planner" link to yesterday. `todayIsoDate` is the dashboard-wide signal from
// `useDashboardRefresh`, so the plan, the routine list, the todo list and the history pie all flip
// to the new day on one edge instead of each noticing separately.
const todayUrlDate = computed(() => usStringToUrlString(todayIsoDate.value))

// --- derived plan ------------------------------------------------------------
const nowMinutes = computed(() => now.value.getHours() * 60 + now.value.getMinutes())

const nonBackgroundTasks = computed(() => tasks.value.filter(task => !task.isBackground))
const sortedTasks = computed(() =>
	[...nonBackgroundTasks.value].sort((a, b) => a.startTime.getInMinutes - b.startTime.getInMinutes),
)
const totalCount = computed(() => nonBackgroundTasks.value.length)
const completedCount = computed(
	() => nonBackgroundTasks.value.filter(task => task.status === PlannerTaskStatus.Completed).length,
)
const progressPercent = computed(() => (totalCount.value === 0 ? 0 : (completedCount.value / totalCount.value) * 100))

function isFinished(task: PlannerTask): boolean {
	return task.status === PlannerTaskStatus.Completed || task.status === PlannerTaskStatus.Cancelled
}

function isActive(task: PlannerTask): boolean {
	return (
		!isFinished(task) &&
		task.startTime.getInMinutes <= nowMinutes.value &&
		task.endTime.getInMinutes > nowMinutes.value
	)
}

function isMissed(task: PlannerTask): boolean {
	return !isFinished(task) && task.endTime.getInMinutes <= nowMinutes.value
}

const activeTask = computed(
	() =>
		sortedTasks.value.find(task => task.status === PlannerTaskStatus.InProgress) ??
		sortedTasks.value.find(isActive) ??
		null,
)
const nextTask = computed(
	() => sortedTasks.value.find(task => !isFinished(task) && task.startTime.getInMinutes > nowMinutes.value) ?? null,
)
const missedTasks = computed(() => sortedTasks.value.filter(isMissed))
const lastMissedTask = computed(() => missedTasks.value[missedTasks.value.length - 1] ?? null)

// Never claim the day is done while unticked tasks remain — surface the missed one instead.
const focusTask = computed(() => activeTask.value ?? nextTask.value ?? lastMissedTask.value)
const focusMode = computed<FocusMode>(() =>
	activeTask.value ? 'now' : nextTask.value ? 'upNext' : lastMissedTask.value ? 'missed' : 'allDone',
)

const minutesUntilNext = computed(() =>
	nextTask.value === null ? null : nextTask.value.startTime.getInMinutes - nowMinutes.value,
)
/** Positive once the running task has outstayed its slot — the hyperfocus case. */
const overrunMinutes = computed(() =>
	activeTask.value === null ? 0 : Math.max(nowMinutes.value - activeTask.value.endTime.getInMinutes, 0),
)
const activeProgress = computed(() => {
	const task = activeTask.value
	if (task === null) return 0
	const span = task.endTime.getInMinutes - task.startTime.getInMinutes
	if (span <= 0) return 100
	return Math.min(((nowMinutes.value - task.startTime.getInMinutes) / span) * 100, 100)
})

function taskColor(task: PlannerTask): string {
	return task.color || task.activity.category?.color || 'rgb(var(--v-theme-primary))'
}

function minutesLabel(minutes: number): string {
	const safeMinutes = Math.max(minutes, 0)
	const hours = Math.floor(safeMinutes / 60)
	const rest = safeMinutes % 60
	if (hours === 0) return `${rest}m`
	return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`
}

function durationLabel(task: PlannerTask): string {
	return minutesLabel(task.endTime.getInMinutes - task.startTime.getInMinutes)
}

// --- commands ----------------------------------------------------------------
// The optimistic update is the right call for this UI — the tick has to feel instant. What was
// missing is the other half: a revert the user can read. Silently un-ticking a task looks like the
// app rejected the input for a reason it will not say.
function reportSaveFailure(key: string, task: PlannerTask) {
	useSnackbar().showErrorSnackbar(i18n.global.t(key, { task: task.activity.name }))
}

async function setStatus(task: PlannerTask, status: PlannerTaskStatus, request?: PatchPlannerTaskStatusRequest) {
	const previous = task.status
	task.status = status
	try {
		await planner().patchStatus(task.id, request ?? new PatchPlannerTaskStatusRequest(status))
		syncStreak()
	} catch {
		task.status = previous
		reportSaveFailure('home.saveStatusFailed', task)
	}
}

async function toggleTaskStatus(task: PlannerTask) {
	const isDone = task.status === PlannerTaskStatus.Completed
	await setStatus(
		task,
		isDone ? PlannerTaskStatus.NotStarted : PlannerTaskStatus.Completed,
		isDone
			? new PatchPlannerTaskStatusRequest(PlannerTaskStatus.NotStarted)
			: new PatchPlannerTaskStatusRequest(
					PlannerTaskStatus.Completed,
					task.actualStartTime,
					Time.fromDate(now.value),
				),
	)
}

async function startTask(task: PlannerTask) {
	if (task.status === PlannerTaskStatus.InProgress) return
	const actualStartTime = Time.fromDate(now.value)
	task.actualStartTime = actualStartTime
	await setStatus(
		task,
		PlannerTaskStatus.InProgress,
		new PatchPlannerTaskStatusRequest(PlannerTaskStatus.InProgress, actualStartTime),
	)
}

async function finishTask(task: PlannerTask) {
	await setStatus(
		task,
		PlannerTaskStatus.Completed,
		new PatchPlannerTaskStatusRequest(PlannerTaskStatus.Completed, task.actualStartTime, Time.fromDate(now.value)),
	)
}

async function skipTask(task: PlannerTask, reason: string) {
	await setStatus(
		task,
		PlannerTaskStatus.Cancelled,
		new PatchPlannerTaskStatusRequest(PlannerTaskStatus.Cancelled, null, null, reason),
	)
}

/** Move a task later, keeping its length. Clamped so it cannot spill past midnight. */
async function snoozeTask(task: PlannerTask, minutes: number) {
	const span = task.endTime.getInMinutes - task.startTime.getInMinutes
	const latestStart = 24 * 60 - 1 - span
	// A missed task snoozes relative to now, an upcoming one relative to its own slot.
	const base = isMissed(task) ? nowMinutes.value : task.startTime.getInMinutes
	const start = Math.min(base + minutes, Math.max(latestStart, 0))
	const previousTimes = { startTime: task.startTime, endTime: task.endTime }
	task.startTime = Time.fromMinutes(start)
	task.endTime = Time.fromMinutes(Math.min(start + span, 24 * 60 - 1))
	try {
		await planner().update(task.id, PlannerTaskRequest.fromEntity(task))
	} catch {
		task.startTime = previousTimes.startTime
		task.endTime = previousTimes.endTime
		reportSaveFailure('home.snoozeFailed', task)
	}
}

/** Give a running task more room instead of letting it silently eat the rest of the plan. */
async function extendTask(task: PlannerTask, minutes: number) {
	const previousEnd = task.endTime
	task.endTime = Time.fromMinutes(Math.min(task.endTime.getInMinutes + minutes, 24 * 60 - 1))
	try {
		await planner().update(task.id, PlannerTaskRequest.fromEntity(task))
	} catch {
		task.endTime = previousEnd
		reportSaveFailure('home.extendFailed', task)
	}
}

// --- streak ------------------------------------------------------------------
// TODO(Bn): per-device only, and the count drifts — see prompts/home/backend/B1-planner-streak.md.
function syncStreak() {
	if (totalCount.value === 0) return
	const streakStore = usePlannerStreakStore()
	if (completedCount.value === totalCount.value) {
		streakStore.registerCompletedDay(now.value)
	} else if (streakStore.completedToday) {
		streakStore.revokeCompletedDay(now.value)
	}
}

// --- transition alerts -------------------------------------------------------
// Missing a block is rarely "forgot the task", it is "did not notice the boundary".
function checkAlerts() {
	// Both sides of every comparison below are minutes-since-midnight with no date component, so a
	// plan from another day would read as a day full of tasks about to start. Between midnight and
	// the rollover refetch that is exactly what is loaded — stay quiet until it has been replaced.
	if (planDate.value !== todayIsoDate.value) return

	for (const task of sortedTasks.value) {
		if (isFinished(task)) continue
		const untilStart = task.startTime.getInMinutes - nowMinutes.value

		if (untilStart <= TRANSITION_WARNING_MINUTES && untilStart > 0) {
			fireOnce(`${task.id}:pre`, () =>
				showNotification(i18n.global.t('home.alertStartingSoon', { minutes: untilStart }), task.activity.name),
			)
		}
		if (untilStart <= 0 && task.endTime.getInMinutes > nowMinutes.value) {
			fireOnce(`${task.id}:start`, () =>
				showNotification(i18n.global.t('home.alertStartNow'), task.activity.name),
			)
		}
		if (task.status === PlannerTaskStatus.InProgress && nowMinutes.value >= task.endTime.getInMinutes) {
			fireOnce(`${task.id}:over`, () => showNotification(i18n.global.t('home.alertOverrun'), task.activity.name))
		}
	}
}

function fireOnce(key: string, action: () => void) {
	if (firedAlerts.has(key)) return
	firedAlerts.add(key)
	action()
}

// --- loading -----------------------------------------------------------------
async function fetchPlan(): Promise<void> {
	const token = ++loadToken
	const isoDate = todayIsoDate.value
	try {
		// TODO(Bn): two serialized round-trips for one screen — the task filter is keyed on
		// calendarId, so the tasks cannot be asked for until the calendar has come back. H7 turned
		// this from a once-per-navigation cost into a repeating one. See
		// prompts/home/backend/B2-plan-by-date.md, which also asks whether an unplanned day 404s
		// here (which would make the "Plan today" empty state below unreachable).
		const loadedCalendar = await calendarQuery().fetchByDate(usStringToUrlString(isoDate))
		const loadedTasks = await planner().fetchFiltered(
			new PlannerTaskFilter(loadedCalendar.id, new Time(0, 0), new Time(23, 59)),
		)
		if (token !== loadToken) return
		calendar.value = loadedCalendar
		tasks.value = loadedTasks
		planDate.value = isoDate
		// Cleared here rather than before the request: a background refresh that fails again must
		// not blink the error state off and the "no plan for today" state on along the way.
		error.value = false
		syncStreak()
	} catch {
		if (token !== loadToken) return
		// Leave calendar/tasks/planDate as they are: on a first load they are already the empty
		// defaults, and on a failed background refresh the previous good plan stays on screen
		// instead of being replaced by a lie ("no plan today") or wiped for no reason.
		error.value = true
	}
}

/** First fetch of a plan: nothing is on screen, so this one owns the spinner. */
async function load(): Promise<void> {
	loading.value = true
	// Safe here, unlike in a background refresh: the spinner has already replaced the error UI, so
	// there is nothing left on screen for a stale flag to contradict.
	error.value = false
	try {
		await fetchPlan()
	} finally {
		loading.value = false
	}
}

/** Re-fetch with the current plan still rendered. Widgets may show `refreshing` or ignore it. */
async function refresh(): Promise<void> {
	refreshing.value = true
	try {
		await fetchPlan()
	} finally {
		refreshing.value = false
	}
}

function ensureLoaded(): Promise<void> {
	loadPromise ??= load()
	return loadPromise
}

function reload(): Promise<void> {
	// Called after tracking finishes, while both widgets are on screen. Reusing `loading` here blanked
	// them both to spinners on every completed timer; a refresh keeps the content and swaps the data
	// underneath it.
	loadPromise = planDate.value === null ? load() : refresh()
	return loadPromise
}

/**
 * Drop the loaded plan and everything derived from it, back to the pre-first-load state.
 *
 * Exported so a session teardown can call it directly; `planScope` below also calls it whenever the
 * signed-in user id changes, which is the path that actually covers every sign-out (the framework
 * has several, and not all of them go through this app's auth adapter).
 */
export function resetTodayPlan(): void {
	loadToken++
	calendar.value = null
	tasks.value = []
	planDate.value = null
	loading.value = true
	refreshing.value = false
	error.value = false
	loadPromise = null
	firedAlerts.clear()
}

// --- lifecycle ---------------------------------------------------------------
// Detached: nothing in here may be owned by a component, because the state it drives is not.
const planScope = effectScope(true)
let scopeWired = false

// HMR swaps this module for a fresh copy with fresh state; without this the previous copy's
// watchers keep running against state nothing renders any more, and every alert fires twice.
if (import.meta.hot) {
	import.meta.hot.dispose(() => planScope.stop())
}

function wireLifecycle(currentTime: Ref<Date>) {
	if (scopeWired) return
	scopeWired = true

	const userStore = useUserStore()

	planScope.run(() => {
		// The framework's clock owns the interval; mirror it into module state the computeds can use.
		watch(currentTime, value => (now.value = value), { immediate: true })

		watch(nowMinutes, checkAlerts)

		// Midnight. The loaded plan is now yesterday's and every key in `firedAlerts` belongs to it.
		watch(todayIsoDate, isoDate => {
			if (planDate.value === null || planDate.value === isoDate) return
			resetTodayPlan()
			void ensureLoaded()
		})

		// Sign out, or sign in as somebody else. Without this the next user's home page short-circuits
		// on the previous user's `loadPromise` and renders their plan.
		watch(
			() => userStore.currentUser.id,
			(id, previousId) => {
				if (id === previousId) return
				const hadPlan = planDate.value !== null
				resetTodayPlan()
				// Only refetch if a plan was actually on screen; otherwise the next mount does it.
				if (hadPlan && id !== 0) void ensureLoaded()
			},
		)
	})
}

export function useTodayPlan() {
	// Called per consumer, not once: the framework clock refcounts its interval by mounted instance.
	const { currentTime } = useCurrentTime()
	wireLifecycle(currentTime)

	// The freshness policy lives here rather than in the two widgets, because the plan is one
	// dataset with one policy — writing it twice is how they drift. The shared key is what keeps a
	// single visibility change from refetching it once for the now bar and once for the planner.
	//
	// This is the staleness-sensitive widget on the page: the plan changes from the day-planner
	// view, from another device, and from a timer finishing, so it takes the backstop poll that the
	// todo widgets do not need.
	//
	// `onDayChange` is off deliberately — a rollover here is not a refetch, it is a reset: the
	// loaded plan and every key in `firedAlerts` belong to yesterday. The `todayIsoDate` watcher in
	// `wireLifecycle` above handles it, off the same signal, so both fire on one edge.
	useDashboardRefresh('home:todayPlan', {
		load: ensureLoaded,
		refresh: reload,
		hasError: () => error.value,
		intervalMinutes: 5,
		onDayChange: false,
		onTrackingSession: true,
	})

	return {
		calendar,
		tasks,
		loading,
		refreshing,
		error,
		now,
		nowMinutes,
		planDate,
		sortedTasks,
		totalCount,
		completedCount,
		progressPercent,
		activeTask,
		nextTask,
		missedTasks,
		lastMissedTask,
		focusTask,
		focusMode,
		minutesUntilNext,
		overrunMinutes,
		activeProgress,
		todayUrlDate,
		streakStore: usePlannerStreakStore(),
		isActive,
		isMissed,
		isFinished,
		taskColor,
		minutesLabel,
		durationLabel,
		toggleTaskStatus,
		startTask,
		finishTask,
		skipTask,
		snoozeTask,
		extendTask,
		ensureLoaded,
		reload,
		refresh,
		resetTodayPlan,
	}
}

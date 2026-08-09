import { computed, ref, watch } from 'vue'
import { useCalendarQuery } from '@/core/activityHistory/api/calendarApi.ts'
import { useTaskPlannerCrud } from '@/core/dayPlanner/api/plannerTaskApi.ts'
import type { Calendar } from '@/core/dayPlanner/dto/response/Calendar.ts'
import type { PlannerTask } from '@/core/dayPlanner/dto/response/PlannerTask.ts'
import { PlannerTaskFilter } from '@/core/dayPlanner/dto/request/PlannerTaskFilter.ts'
import { PlannerTaskRequest } from '@/core/dayPlanner/dto/request/PlannerTaskRequest.ts'
import { PatchPlannerTaskStatusRequest } from '@/core/dayPlanner/dto/request/PatchPlannerTaskStatusRequest.ts'
import { PlannerTaskStatus } from '@/core/dayPlanner/dto/enum/PlannerTaskStatus.ts'
import { Time } from '@/_common/dto/dto/Time.ts'
import { formatDateForApi, usStringToUrlString } from '@/_common/utils/DateTimeHelper.ts'
import { useCurrentTime } from '@/_common/composable/general/useCurrentTime.ts'
import { showNotification } from '@/_common/utils/notifications.ts'
import { usePlannerStreakStore } from '@/core/home/store/plannerStreakStore.ts'
import i18n from '@/i18n.ts'

export type FocusMode = 'now' | 'upNext' | 'missed' | 'allDone'

/** Minutes before a task starts that the "get ready" warning fires. */
export const TRANSITION_WARNING_MINUTES = 10

// Module-level state: the now bar and the planner widget are two views of one plan, so they share
// one fetch and one set of derived values instead of drifting apart.
const calendar = ref<Calendar | null>(null)
const tasks = ref<PlannerTask[]>([])
const loading = ref(true)
const now = ref(new Date())

let loadPromise: Promise<void> | null = null
let alertsWired = false
const firedAlerts = new Set<string>()

export function useTodayPlan() {
	const { fetchByDate } = useCalendarQuery()
	const { fetchFiltered, patchStatus, update } = useTaskPlannerCrud()
	const { currentTime } = useCurrentTime()
	const streakStore = usePlannerStreakStore()

	// The framework's clock owns the interval; mirror it into module state the computeds can use.
	watch(currentTime, value => (now.value = value), { immediate: true })

	const todayUrlDate = usStringToUrlString(formatDateForApi(new Date()))
	const nowMinutes = computed(() => now.value.getHours() * 60 + now.value.getMinutes())

	const nonBackgroundTasks = computed(() => tasks.value.filter(task => !task.isBackground))
	const sortedTasks = computed(() =>
		[...nonBackgroundTasks.value].sort((a, b) => a.startTime.getInMinutes - b.startTime.getInMinutes),
	)
	const totalCount = computed(() => nonBackgroundTasks.value.length)
	const completedCount = computed(
		() => nonBackgroundTasks.value.filter(task => task.status === PlannerTaskStatus.Completed).length,
	)
	const progressPercent = computed(() =>
		totalCount.value === 0 ? 0 : (completedCount.value / totalCount.value) * 100,
	)

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
		() =>
			sortedTasks.value.find(task => !isFinished(task) && task.startTime.getInMinutes > nowMinutes.value) ?? null,
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

	// --- commands --------------------------------------------------------------
	async function setStatus(task: PlannerTask, status: PlannerTaskStatus, request?: PatchPlannerTaskStatusRequest) {
		const previous = task.status
		task.status = status
		try {
			await patchStatus(task.id, request ?? new PatchPlannerTaskStatusRequest(status))
			syncStreak()
		} catch {
			task.status = previous
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
			new PatchPlannerTaskStatusRequest(
				PlannerTaskStatus.Completed,
				task.actualStartTime,
				Time.fromDate(now.value),
			),
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
			await update(task.id, PlannerTaskRequest.fromEntity(task))
		} catch {
			task.startTime = previousTimes.startTime
			task.endTime = previousTimes.endTime
		}
	}

	/** Give a running task more room instead of letting it silently eat the rest of the plan. */
	async function extendTask(task: PlannerTask, minutes: number) {
		const previousEnd = task.endTime
		task.endTime = Time.fromMinutes(Math.min(task.endTime.getInMinutes + minutes, 24 * 60 - 1))
		try {
			await update(task.id, PlannerTaskRequest.fromEntity(task))
		} catch {
			task.endTime = previousEnd
		}
	}

	// --- streak ----------------------------------------------------------------
	function syncStreak() {
		if (totalCount.value === 0) return
		if (completedCount.value === totalCount.value) {
			streakStore.registerCompletedDay(now.value)
		} else if (streakStore.completedToday) {
			streakStore.revokeCompletedDay(now.value)
		}
	}

	// --- transition alerts -----------------------------------------------------
	// Missing a block is rarely "forgot the task", it is "did not notice the boundary".
	function checkAlerts() {
		for (const task of sortedTasks.value) {
			if (isFinished(task)) continue
			const untilStart = task.startTime.getInMinutes - nowMinutes.value

			if (untilStart <= TRANSITION_WARNING_MINUTES && untilStart > 0) {
				fireOnce(`${task.id}:pre`, () =>
					showNotification(
						i18n.global.t('home.alertStartingSoon', { minutes: untilStart }),
						task.activity.name,
					),
				)
			}
			if (untilStart <= 0 && task.endTime.getInMinutes > nowMinutes.value) {
				fireOnce(`${task.id}:start`, () =>
					showNotification(i18n.global.t('home.alertStartNow'), task.activity.name),
				)
			}
			if (task.status === PlannerTaskStatus.InProgress && nowMinutes.value >= task.endTime.getInMinutes) {
				fireOnce(`${task.id}:over`, () =>
					showNotification(i18n.global.t('home.alertOverrun'), task.activity.name),
				)
			}
		}
	}

	function fireOnce(key: string, action: () => void) {
		if (firedAlerts.has(key)) return
		firedAlerts.add(key)
		action()
	}

	// --- loading ---------------------------------------------------------------
	async function load() {
		loading.value = true
		try {
			calendar.value = await fetchByDate(todayUrlDate)
			tasks.value = await fetchFiltered(
				new PlannerTaskFilter(calendar.value.id, new Time(0, 0), new Time(23, 59)),
			)
			syncStreak()
		} catch {
			calendar.value = null
			tasks.value = []
		} finally {
			loading.value = false
		}
	}

	function ensureLoaded(): Promise<void> {
		loadPromise ??= load()
		return loadPromise
	}

	function reload(): Promise<void> {
		loadPromise = load()
		return loadPromise
	}

	if (!alertsWired) {
		alertsWired = true
		watch(nowMinutes, checkAlerts)
	}

	return {
		calendar,
		tasks,
		loading,
		now,
		nowMinutes,
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
		streakStore,
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
	}
}

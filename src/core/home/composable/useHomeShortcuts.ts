import { useRouter } from 'vue-router'
import { useKeyboardShortcuts } from '@/_common/composable/general/useKeyboardShortcuts.ts'
import { requestNotificationPermission } from '@/_common/utils/notifications.ts'
// Imported directly rather than through `useTodayPlan()`, for the reason recorded above
// `nowMinutes` there: calling the composable registers a `useDashboardRefresh` consumer, and this
// module needs plan state without wanting a say in when the plan is refetched.
import {
	focusMode,
	focusTask,
	finishTask,
	snoozeTask,
	SNOOZE_OPTIONS,
	startTask,
	todayUrlDate,
} from '@/core/home/composable/useTodayPlan.ts'
import { openTracker, useTaskTracker } from '@/core/home/composable/useTaskTracker.ts'

/**
 * The keys, in one place, because two files need them: this module binds them and NowBar renders
 * them into the buttons' tooltips. A shortcut nobody can see is a shortcut nobody uses.
 *
 * Single letters with no modifier — the point is that starting the thing you are supposed to be
 * doing costs one keystroke, which a chord does not.
 */
export const HOME_SHORTCUT_KEYS = {
	start: 's',
	finish: 'f',
	track: 't',
	/** `m` for "move later", the label the menu already uses. */
	snooze: 'm',
	planner: 'p',
} as const

/** `Start (S)` — the hint that goes in a `title`, next to an already-translated label. */
export function withShortcut(label: string, key: string): string {
	return `${label} (${key.toUpperCase()})`
}

/** The menu's first snooze option, so the key and the menu cannot disagree. */
const SNOOZE_MINUTES = SNOOZE_OPTIONS[0]

/**
 * Home-page keyboard shortcuts for the focus task.
 *
 * Call this **once, from HomeView** — not from a widget. The binding primitive keeps one document
 * listener however many callers there are, but a second caller would still double the handlers, and
 * the widgets are not the thing guaranteed to be on the page exactly once.
 *
 * Every action here already exists as a button or a menu item; none of them is keyboard-only.
 */
export function useHomeShortcuts(): void {
	const router = useRouter()
	const { isOpen: trackerOpen } = useTaskTracker()

	function hasFocusTask(): boolean {
		return focusTask.value !== null
	}

	useKeyboardShortcuts(
		[
			{
				key: HOME_SHORTCUT_KEYS.start,
				// Mirrors NowBar's button, which is Start until the task is running and Done after.
				enabled: () => hasFocusTask() && focusMode.value !== 'now',
				handler: () => {
					// Same reason as that button: browsers only grant the permission from a gesture,
					// and a keypress is one.
					void requestNotificationPermission()
					void startTask(focusTask.value!)
				},
			},
			{
				key: HOME_SHORTCUT_KEYS.finish,
				enabled: () => hasFocusTask() && focusMode.value === 'now',
				handler: () => void finishTask(focusTask.value!),
			},
			{
				key: HOME_SHORTCUT_KEYS.track,
				enabled: hasFocusTask,
				handler: () => openTracker(focusTask.value!),
			},
			{
				key: HOME_SHORTCUT_KEYS.snooze,
				enabled: hasFocusTask,
				handler: () => void snoozeTask(focusTask.value!, SNOOZE_MINUTES),
			},
			{
				key: HOME_SHORTCUT_KEYS.planner,
				handler: () => void router.push({ name: 'dayPlanner', params: { date: todayUrlDate.value } }),
			},
		],
		// The timer dialog covers the page these keys would otherwise be acting on.
		{ enabled: () => !trackerOpen.value },
	)
}

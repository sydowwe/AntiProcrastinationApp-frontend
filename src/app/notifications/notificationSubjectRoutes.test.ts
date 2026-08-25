import { beforeAll, describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
// `?raw` rather than node:fs — @types/node is not in this project's tsconfig, and importing the
// route table normally would drag in every scheduler view component for a string comparison.
import schedulerRoutesSource from '@/_common/modules/scheduler/scheduler.routes.ts?raw'
import dayPlannerRoutesSource from '@/core/dayPlanner/dayPlanner.routes.ts?raw'
import todoListRoutesSource from '@/core/todoList/todoList.routes.ts?raw'
import {
	notificationRoute,
	setNotificationTypeMeta,
} from '@/_common/modules/notifications/utils/notificationTypeMeta.ts'
import { NotificationResponse } from '@/_common/modules/notifications/dto/NotificationResponse.ts'
import { notificationTypeMeta } from '@/app/notifications/notificationTypeMeta.ts'

// The shared map is a classic script in public/ — it assigns globals rather than exporting, because
// the service worker loads it with importScripts and cannot import a module. Importing it here for
// its side effects is what the <script> tag in index.html does, and what workbox's importScripts
// does for the worker: same file, same globals, all three readers.
import '../../../public/notification-subject-routes.js'

function notification(type: string, subject?: { kind: string; id: number }): NotificationResponse {
	return NotificationResponse.fromJson({
		id: 91021,
		type,
		title: 'Title',
		body: 'Body',
		createdAt: '2026-08-25T09:30:00Z',
		isRead: false,
		subject,
	})
}

beforeAll(() => {
	setNotificationTypeMeta(notificationTypeMeta)
})

describe('the map stays in step with the route table', () => {
	// The paths in the shared map are duplicated from the route tables and nothing type-checks the
	// pair — the worker has no router to resolve a route name against, so paths are the only currency
	// both readers share. This compares against the route file's own text so a renamed path fails
	// here instead of silently producing a 404 from a notification.
	it('scheduledJobRun still points at a path the router serves', () => {
		expect(globalThis.NOTIFICATION_SUBJECT_ROUTES?.scheduledJobRun(77)).toBe('/planovac/behy/77')
		// The route declares `/planovac/behy/:id(\d+)`; the built path must share its literal prefix.
		expect(schedulerRoutesSource).toContain("path: '/planovac/behy/:id")
	})

	it('plannerTask still points at the redirect route, not at the dated day view', () => {
		expect(globalThis.NOTIFICATION_SUBJECT_ROUTES?.plannerTask(91)).toBe('/day-planner/task/91')
		expect(dayPlannerRoutesSource).toContain("path: '/day-planner/task/:id")
	})

	it('routinePeriod still points at the routine list', () => {
		expect(globalThis.NOTIFICATION_SUBJECT_ROUTES?.routinePeriod(77)).toBe('/routine-todo-list?focus=77')
		expect(todoListRoutesSource).toContain("path: '/routine-todo-list'")
	})

	it('does not let /day-planner/:date swallow the task redirect', () => {
		// The two patterns overlap in their first segment, and if `:date` won, `/day-planner/task/91`
		// would silently open the planner for a day called "task" instead of resolving the task. The
		// route table's own strings are pinned by the `?raw` assertions above; this pins vue-router's
		// ranking of them, which is the half no amount of reading the file tells you.
		const router = createRouter({
			history: createMemoryHistory(),
			routes: [
				{ path: '/day-planner/task/:id(\\d+)', name: 'dayPlannerTask', component: {} },
				{ path: '/day-planner/:date', name: 'dayPlanner', component: {} },
			],
		})

		expect(router.resolve('/day-planner/task/91').name).toBe('dayPlannerTask')
		expect(router.resolve('/day-planner/25-08-2026').name).toBe('dayPlanner')
	})

	it('has no entry for kinds this app cannot show', () => {
		// `reminder` is a Planning-module Reminder row and this frontend has no view for that entity —
		// the framework's reminders screens list ReminderDefinitions, a different id space. An entry
		// here would deep-link to the wrong row rather than to a list.
		expect(globalThis.NOTIFICATION_SUBJECT_ROUTES?.reminder).toBeUndefined()
		expect(globalThis.NOTIFICATION_SUBJECT_ROUTES?.inventoryItem).toBeUndefined()
	})
})

describe('resolving a subject', () => {
	it('deep-links the one kind that has a destination', () => {
		expect(notificationRoute(notification('ScheduledJobFailed', { kind: 'scheduledJobRun', id: 77 }))).toBe(
			'/planovac/behy/77',
		)
	})

	it('deep-links a task-attached personal reminder to the task', () => {
		expect(notificationRoute(notification('PersonalReminder', { kind: 'plannerTask', id: 91 }))).toBe(
			'/day-planner/task/91',
		)
	})

	it('deep-links every routine type to the period it is about', () => {
		for (const type of ['RoutinePeriodEndingSoon', 'RoutinePeriodEnded', 'RoutineStreakGraceExpiring']) {
			expect(notificationRoute(notification(type, { kind: 'routinePeriod', id: 77 }))).toBe(
				'/routine-todo-list?focus=77',
			)
		}
	})

	it('falls back to the type route when the kind has no destination in this app', () => {
		// A standalone reminder. The id is a Planning `Reminder`, which this frontend cannot render —
		// so it must land on the reminders list, exactly as before B2, and not on a wrong-entity detail.
		expect(notificationRoute(notification('PersonalReminder', { kind: 'reminder', id: 483 }))).toEqual({
			name: 'myReminders',
		})
	})

	it('falls back to the type route for a kind it has never heard of', () => {
		// The vocabulary is append-only and grows server-side without coordination.
		expect(notificationRoute(notification('PersonalReminder', { kind: 'somethingNewNextQuarter', id: 5 }))).toEqual(
			{
				name: 'myReminders',
			},
		)
	})

	it('falls back to the type route when there is no subject at all', () => {
		expect(notificationRoute(notification('PersonalReminder'))).toEqual({ name: 'myReminders' })
		expect(notificationRoute(notification('RoutinePeriodEndingSoon'))).toEqual({ name: 'routineToDoList' })
	})

	it('still navigates nowhere for a failure with no run row', () => {
		// ScheduledJobFailed omits the subject when the failure has no run (handler not found), and
		// there is nothing useful to open. Same no-navigation behaviour it had before B2.
		expect(notificationRoute(notification('ScheduledJobFailed'))).toBeUndefined()
	})

	it('keeps the settled constants constant even if a subject somehow arrives', () => {
		expect(notificationRoute(notification('DeadlineApproaching', { kind: 'scheduledJobRun', id: 77 }))).toEqual({
			name: 'myReminders',
		})
		expect(notificationRoute(notification('ReminderDigest', { kind: 'scheduledJobRun', id: 77 }))).toEqual({
			name: 'myReminders',
		})
	})
})

describe('both deliveries of one event land in the same place', () => {
	// The fixtures are the ones the backend's own NotificationSubjectProjectionTests seeds, so both
	// sides of the wire are asserting the same events.
	it.each([
		['ScheduledJobFailed', { kind: 'scheduledJobRun', id: 77 }, '/planovac/behy/77'],
		['PersonalReminder', { kind: 'plannerTask', id: 91 }, '/day-planner/task/91'],
		['RoutinePeriodEndingSoon', { kind: 'routinePeriod', id: 77 }, '/routine-todo-list?focus=77'],
	])('agrees between the bell and the service worker for %s', (type, subject, expected) => {
		const inApp = notificationRoute(notification(type as string, subject as { kind: string; id: number }))
		const push = globalThis.resolveNotificationTargetUrl?.({ id: 91021, type, subject })

		expect(inApp).toBe(push)
		expect(push).toBe(expected)
	})

	it('prefers the subject over a producer-supplied url', () => {
		expect(
			globalThis.resolveNotificationTargetUrl?.({
				subject: { kind: 'scheduledJobRun', id: 77 },
				url: '/somewhere/else',
			}),
		).toBe('/planovac/behy/77')
	})

	it('uses the producer url when there is no subject', () => {
		// TimerBoundary is the only kind that supplies one. It carries no subject and is absent from
		// this app's typeMeta, so in-app it navigates nowhere while push follows the url — a sanctioned
		// asymmetry (B2: "in-app it keeps whatever type-level route it has today"), not a drift bug.
		expect(globalThis.resolveNotificationTargetUrl?.({ type: 'TimerBoundary', url: '/activity-tracking' })).toBe(
			'/activity-tracking',
		)
	})

	it('falls back to the root when there is neither', () => {
		expect(globalThis.resolveNotificationTargetUrl?.({ type: 'ReminderDigest' })).toBe('/')
		expect(globalThis.resolveNotificationTargetUrl?.(undefined)).toBe('/')
	})

	it('ignores a malformed subject rather than building a broken path', () => {
		expect(globalThis.resolveNotificationTargetUrl?.({ subject: { kind: 'scheduledJobRun' } })).toBe('/')
		expect(globalThis.resolveNotificationTargetUrl?.({ subject: { kind: 'scheduledJobRun', id: 'abc' } })).toBe('/')
		expect(globalThis.resolveNotificationSubjectPath?.(undefined)).toBeUndefined()
	})
})

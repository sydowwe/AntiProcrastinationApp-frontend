import type { RouteLocationRaw } from 'vue-router'
import type { NotificationTypeMeta } from '@/_common/modules/notifications/utils/notificationTypeMeta.ts'
import type { NotificationResponse } from '@/_common/modules/notifications/dto/NotificationResponse.ts'

// Icon, colour and click-through target per notification `type`. App-owned on purpose: the keys are
// members of this backend's `Sydowwe.Framework.Contracts.notification.NotificationType` enum
// (serialised by name — the API registers a JsonStringEnumConverter), and the routes are this app's
// own. A type missing from this map renders a plain bell with no navigation, so adding one
// server-side is never breaking.
//
// Click-through resolves in two steps, and the order is the whole point of B2:
//
//   1. `notification.subject` — an opaque `{ kind, id }` naming the entity this notification is
//      about — through the app-owned map in `public/notification-subject-routes.js`;
//   2. failing that, the constant route for the `type`, which is where every one of these went
//      before B2 and is still where most of them go.
//
// Step 2 is not a degraded path, it is the normal one for anything that has no single subject, and
// it is also what an APPEND-ONLY kind vocabulary requires: the server will emit kinds this app has
// never heard of, and those must land on the type route rather than nowhere.

/**
 * The subject's destination, or `fallback` when there is no subject, the kind is unknown, or this
 * app has nowhere to put that kind.
 *
 * Reads the same map the service worker resolves push clicks through, so a click on either delivery
 * of one event lands in the same place. Optional-called: if that script ever fails to load, every
 * notification quietly falls back to its type route instead of throwing at the click site.
 */
function subjectRoute(notification: NotificationResponse, fallback?: RouteLocationRaw): RouteLocationRaw | undefined {
	return globalThis.resolveNotificationSubjectPath?.(notification.subject) ?? fallback
}

export const notificationTypeMeta: Record<string, NotificationTypeMeta> = {
	// PERMANENTLY constant, settled in B2: `DeadlineApproaching` is the cross-module kind — any module
	// can register a reminder under it, and the producer composes a title precisely because there is
	// no single entity behind it. It carries no subject and never will. Not a gap; do not re-file it.
	DeadlineApproaching: { icon: 'triangle-exclamation', color: 'warning', route: { name: 'myReminders' } },

	// Two kinds from one type — `plannerTask` when the reminder names a task, `reminder` when it is
	// standalone. Resolving on the notification rather than the type is exactly what the seam is for.
	// Neither kind has a destination in this app yet (see the table in the map file), so both fall
	// through to the list for now; this line needs no change when they gain one.
	PersonalReminder: { icon: 'bell', color: 'primary', route: n => subjectRoute(n, { name: 'myReminders' }) },

	// PERMANENTLY constant, settled in B2: a digest is about N occurrences by construction — its
	// payload carries a count and a per-kind breakdown, never a single id — so the list IS the
	// specific target. Not a gap either.
	ReminderDigest: { icon: 'layer-group', color: 'primary', route: { name: 'myReminders' } },

	// All three carry `routinePeriod`. No destination for it yet, so all three currently land on the
	// list, exactly as before.
	RoutinePeriodEndingSoon: {
		icon: 'hourglass-half',
		color: 'warning',
		route: n => subjectRoute(n, { name: 'routineToDoList' }),
	},
	RoutinePeriodEnded: {
		icon: 'flag-checkered',
		color: 'success',
		route: n => subjectRoute(n, { name: 'routineToDoList' }),
	},
	RoutineStreakGraceExpiring: {
		icon: 'fire',
		color: 'warning',
		route: n => subjectRoute(n, { name: 'routineToDoList' }),
	},

	// The one kind that actually deep-links today: `scheduledJobRun` → `/planovac/behy/:id`.
	//
	// (The comment that used to sit here said this app has no scheduler admin screen. That was wrong
	// — `schedulerRoutes` is spread in `router.ts` and ships a run-detail view, which already renders
	// a not-found alert, so a run purged out from under the notification is safe to link to.)
	//
	// No fallback on purpose: the subject is absent when the failure has no run row at all (handler
	// not found), and there is nothing useful to open in that case. That is the same no-navigation
	// behaviour this type had before B2.
	ScheduledJobFailed: { icon: 'circle-exclamation', color: 'error', route: n => subjectRoute(n) },

	// Never carries a subject — an overdue job has no run row by definition, which is the condition
	// being reported. Stays unrouted.
	ScheduledJobOverdue: { icon: 'clock', color: 'warning' },

	Test: { icon: 'flask', color: 'textMuted' },
}

import type { NotificationTypeMeta } from '@/_common/modules/notifications/utils/notificationTypeMeta.ts'

// Icon, colour and click-through target per notification `type`. App-owned on purpose: the keys are
// exactly the members of this backend's `MojaDigitalnaFirma.Kernel.notification.NotificationType`
// enum (serialised by name — the API registers a JsonStringEnumConverter), and the routes are this
// app's own. A type missing from this map renders a plain bell with no navigation, so adding one
// server-side is never breaking.
export const notificationTypeMeta: Record<string, NotificationTypeMeta> = {
	DeadlineApproaching: { icon: 'triangle-exclamation', color: 'warning', route: { name: 'myReminders' } },
	PersonalReminder: { icon: 'bell', color: 'primary', route: { name: 'myReminders' } },
	ReminderDigest: { icon: 'layer-group', color: 'primary', route: { name: 'myReminders' } },

	RoutinePeriodEndingSoon: { icon: 'hourglass-half', color: 'warning', route: { name: 'routineToDoList' } },
	RoutinePeriodEnded: { icon: 'flag-checkered', color: 'success', route: { name: 'routineToDoList' } },
	RoutineStreakGraceExpiring: { icon: 'fire', color: 'warning', route: { name: 'routineToDoList' } },

	// Scheduler health. No route: this app has no scheduler admin screen, and a dead link is worse
	// than none — the server-rendered title/body already carries the job key.
	ScheduledJobFailed: { icon: 'circle-exclamation', color: 'error' },
	ScheduledJobOverdue: { icon: 'clock', color: 'warning' },

	Test: { icon: 'flask', color: 'textMuted' },
}

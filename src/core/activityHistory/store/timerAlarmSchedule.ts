import { getActiveRegistration } from '@/_common/utils/serviceWorker.ts'
import { isNotificationSupported, requestNotificationPermission } from '@/_common/utils/notifications.ts'
import {
	ScheduleTimerAlarmsRequest,
	TimerAlarmBoundaryRequest,
} from '@/core/activityHistory/dto/request/ScheduleTimerAlarmsRequest.ts'
import { cancelTimerAlarms, scheduleTimerAlarms } from '@/core/activityHistory/api/timerAlarmApi.ts'
import { timerRoutePath, type TimerBoundary } from '@/core/activityHistory/store/timerBoundaries.ts'
import type { TimerKind } from '@/core/activityHistory/store/runningTimerStore.ts'

/**
 * Getting a timer's boundaries registered as server-side alarms, and keeping the tab's own alarm
 * from doubling up with them.
 *
 * The store decides *what* the boundaries are (`timerBoundaries.ts`) and *when* the set changes;
 * this file is the plumbing between that and the API, plus the two details that have to agree with
 * the server byte for byte — the session id and the notification tag.
 */

/**
 * The identity of one timing session, for the alarm scheduler only.
 *
 * A running timer has no server-side identity: nothing about it is persisted server-side until it
 * is logged as history, and this whole feature exists so that it does not have to be. So the client
 * owns the id, mints it at Start, and **persists it with the session** — a reloaded tab has to be
 * able to cancel a set that a previous page load registered, and an id that goes missing leaves
 * alarms nothing can name and therefore nothing can cancel.
 *
 * `randomUUID` is only exposed in secure contexts; the fallback is not cryptographically anything
 * and does not need to be. Two sessions on one account colliding is the only thing that matters and
 * 122 bits of `Math.random` is far past enough for a value that lives at most twelve hours.
 */
export function newAlarmSessionId(): string {
	if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
	return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`
}

/** At most 64 boundaries per session, none more than 24 hours out. Both are API validation limits. */
const MAX_SCHEDULED = 64
const MAX_HORIZON_MS = 24 * 60 * 60 * 1000

/**
 * Trim a projection down to what the API will accept.
 *
 * Enforced here rather than left to the server because the server's answer to an over-long set is a
 * 400 for the *whole* request, which this module swallows — so an eight-cycle preset would silently
 * get no alarms at all instead of its first sixty-four. Trimming turns a total failure into the
 * partial coverage the user can actually use, and the boundaries dropped are the furthest away.
 *
 * Neither cap can bite in practice today: the store drops any session older than twelve hours, and
 * the largest cycle anyone can configure is 63 boundaries. They are enforced anyway because "cannot
 * happen today" is a property of the preset limits, not of this file.
 */
export function clampToContract(boundaries: TimerBoundary[]): TimerBoundary[] {
	const horizon = Date.now() + MAX_HORIZON_MS
	return boundaries.filter(boundary => boundary.at <= horizon).slice(0, MAX_SCHEDULED)
}

/**
 * The notification tag shared by the tab's own alarm and the push for the same boundary.
 *
 * ## This is the whole double-alarm suppression, and it is derived on both sides
 *
 * With the tab open at `endsAt` the store rings *and* the push arrives, because the server has no
 * idea the tab came back. The two obvious fixes both have a hole in them:
 *
 *  - **The client declines to ring when it knows a push is scheduled.** The push is the worse of the
 *    two notifications in exactly the case where the good one is available: no sound loop, no tab
 *    title animation, and delivery latency measured in seconds. It also fails open in the wrong
 *    direction — the client would go quiet on the strength of a registration it has no delivery
 *    confirmation for.
 *  - **The service worker declines to show when a visible client exists.** This fights
 *    `userVisibleOnly: true`, which every push subscription here is made with
 *    (`UsePushNotifications.ts`). A subscription that repeatedly takes a push without showing
 *    anything is spending browser-enforced budget, and Chrome's remedy is to show its own generic
 *    "this site was updated in the background" — a worse notification than the one being suppressed.
 *    A pomodoro cycle is up to fifteen boundaries, so this is not a rare path.
 *
 * So neither: **both notifications are shown with the same `tag`, and the platform collapses them.**
 * A notification whose tag is already on screen replaces it in place rather than stacking, and
 * without `renotify` it replaces silently. The user sees one notification whether zero, one or both
 * arrive, and `userVisibleOnly` is honoured on every push.
 *
 * **The format is a contract with the server**, which derives the identical string from the same
 * instant and puts it in the push. Change it here and the push stops replacing and starts stacking —
 * which is exactly what it did until the backend fixed the envelope that was dropping `tag` on the
 * floor, and it is not a failure that announces itself.
 */
export function alarmTag(at: number): string {
	return `timer-boundary-${at}`
}

/**
 * Register this session's alarms, replacing whatever was registered for it before.
 *
 * Never rejects. A failure costs the user the alarm they would not have had at all before this
 * feature existed; it must not cost them the timer.
 */
export async function pushTimerAlarms(
	sessionId: string,
	activityId: number | null,
	kind: TimerKind,
	boundaries: TimerBoundary[],
): Promise<void> {
	const request = new ScheduleTimerAlarmsRequest(
		sessionId,
		boundaries.map(
			boundary =>
				new TimerAlarmBoundaryRequest(
					new Date(boundary.at).toISOString(),
					boundary.phase,
					boundary.phaseIndex,
					boundary.phaseTotal,
					boundary.cycleIndex,
					boundary.cycleTotal,
				),
		),
		activityId,
		timerRoutePath(kind),
	)
	try {
		await scheduleTimerAlarms(request)
	} catch (e) {
		// Offline, signed out, or the server is unhappy. All of them mean "no alarm with the tab
		// closed", which is where this module started.
		console.warn('Timer alarms could not be scheduled:', e)
	}
}

/** Cancel this session's alarms. Unconditional — an unknown session is a no-op server-side. */
export async function dropTimerAlarms(sessionId: string): Promise<void> {
	try {
		await cancelTimerAlarms(sessionId)
	} catch (e) {
		console.warn('Timer alarms could not be cancelled:', e)
	}
}

/**
 * The tab's own boundary notification, tagged so the matching push collapses into it.
 *
 * A near-copy of `_common/utils/notifications.ts`'s `showNotification`, which takes no options and
 * therefore cannot set a tag. The framework should grow an options parameter — that ask is
 * `migration-revision.md` §9 — and this drops to a one-line call when it does.
 */
export async function showTimerAlarmNotification(title: string, body: string, at: number): Promise<void> {
	if (!isNotificationSupported()) return

	let permission = Notification.permission
	if (permission === 'default') permission = await requestNotificationPermission()
	if (permission !== 'granted') return

	const registration = await getActiveRegistration()
	if (registration === undefined) return

	await registration.showNotification(title, { body, tag: alarmTag(at) })
}

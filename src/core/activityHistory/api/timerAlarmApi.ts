import { API } from '@/_common/axiosConfig.ts'
import type { ScheduleTimerAlarmsRequest } from '@/core/activityHistory/dto/request/ScheduleTimerAlarmsRequest.ts'

/**
 * The server-side alarms that ring when the tab is not there.
 *
 * Two routes, both keyed by the client-generated `sessionId` and both idempotent, which is what
 * lets `timerAlarmSchedule.ts` call them without ever branching on what landed before.
 *
 * `_silent` on both: a failure here costs the user the alarm they would not have had at all before
 * this existed, and the client-side `setTimeout` still rings for anyone whose tab is alive. That is
 * not worth interrupting a running focus session with a snackbar about.
 *
 * Note for anyone extending this: these endpoints are denied to web-extension clients — main SPA
 * only. An extension that wants to start a timer needs a backend change first.
 */

const BASE = '/activity-history/timer-alarm'

/**
 * Registers the session's alarms, replacing any set already registered under the same `sessionId`.
 *
 * Resolves to how many boundaries were actually scheduled, which is what was posted minus any that
 * had already elapsed — the server drops those rather than firing them, and rather than failing the
 * whole request over them.
 */
export async function scheduleTimerAlarms(request: ScheduleTimerAlarmsRequest): Promise<number> {
	const { data } = await API.post(`${BASE}/schedule`, request, { _silent: true })
	return (data?.registered as number | undefined) ?? 0
}

/**
 * Cancels every alarm for a session.
 *
 * Unconditional by design: an unknown or already-cancelled session is a no-op rather than a 404,
 * because a partially-registered set is the normal outcome of a tab dying mid-flight. Never branch
 * on the result.
 */
export async function cancelTimerAlarms(sessionId: string): Promise<void> {
	await API.post(`${BASE}/cancel`, { sessionId }, { _silent: true })
}

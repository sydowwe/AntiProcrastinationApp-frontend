import { useEntityQuery } from '@/_common/api/useEntityQuery.ts'
import { useEntityCommand } from '@/_common/api/useEntityCommand.ts'
import { API } from '@/_common/axiosConfig.ts'
import { Time } from '@/_common/dto/dto/Time.ts'
import { ActivityHistoryRequest } from '@/core/activityHistory/dto/request/ActivityHistoryRequest.ts'
import type { ActivityHistorySessionRequest } from '@/core/activityHistory/dto/request/ActivityHistorySessionRequest.ts'
import { ActivityHistory } from '@/core/activityHistory/dto/response/ActivityHistory.ts'
import { SessionFit } from '@/core/activityHistory/dto/response/SessionFit.ts'

export function useActivityHistoryCrud() {
	const url = 'activity-history'
	const { fetchById, fetchAll, fetchSelectOptions } = useEntityQuery<ActivityHistory>({
		responseClass: ActivityHistory,
		entityName: 'activity',
	})
	const {
		createWithResponse,
		create: baseCreate,
		update,
		deleteEntity,
	} = useEntityCommand<ActivityHistory, ActivityHistoryRequest, ActivityHistoryRequest>({
		responseClass: ActivityHistory,
		createRequestClass: ActivityHistoryRequest,
		updateRequestClass: ActivityHistoryRequest,
		entityName: url,
	})

	async function create(startTimestamp: Date, length?: Time, activityId?: number, link: HistoryItemLink = {}) {
		const request = new ActivityHistoryRequest(
			startTimestamp,
			length ?? Time.fromMinutes(0),
			activityId ?? -1,
			link.todoListItemId ?? null,
			link.routineTodoListId ?? null,
		)
		return baseCreate(request)
	}

	/**
	 * Writes what a timer embedded in `TrackTimeDialog` tracked. A timer or pomodoro goes through the session
	 * endpoint, the way the routed views save, so it keeps its outcome, its plan and a pomodoro's rest rows.
	 * A stopwatch, or a session that cannot be one, is the plain row it always was. Either way it carries
	 * `link`, which is what puts the time on the item's row of the daily recap. Answers the ids written, one
	 * per row. Not `_silent`: like `create`, a failure throws and the interceptor shows it.
	 */
	async function createTracked(
		tracked: TrackedTime,
		activityId: number,
		link: HistoryItemLink = {},
	): Promise<number[]> {
		if (tracked.session === null) return [await create(tracked.startTimestamp, tracked.length, activityId, link)]
		const { data } = await API.post('/activity-history/session', {
			...tracked.session,
			todoListItemId: link.todoListItemId ?? null,
			routineTodoListId: link.routineTodoListId ?? null,
		})
		return data.recordIds ?? []
	}

	return { fetchById, fetchAll, fetchSelectOptions, createWithResponse, create, createTracked, update, deleteEntity }
}

/** What `TrackTimeDialog` hands its embedder once the user confirms. */
export interface TrackedTime {
	startTimestamp: Date
	/** What the embedder quotes and writes to its task: the run's length, or a pomodoro's focus total. */
	length: Time
	/** The run as a timer session, or null for a stopwatch and for a session that cannot be one. */
	session: ActivityHistorySessionRequest | null
}

/** The to-do or routine item time was logged from, when there is one. At most one of the two is set. */
export interface HistoryItemLink {
	todoListItemId?: number | null
	routineTodoListId?: number | null
}

/**
 * F2-07: the focus length that usually works for `activityId`. `_silent`, and an empty fit on failure: it decorates a
 * timer setup the user opened to start a timer, so a failure must leave the chip off rather than raise an error toast.
 */
export async function fetchSessionFit(activityId: number): Promise<SessionFit> {
	try {
		const { data } = await API.get('/activity-history/session/fit', { params: { activityId }, _silent: true })
		return SessionFit.fromJson(data)
	} catch {
		return new SessionFit()
	}
}

/**
 * Writes a finished timer session and all its rows in one transaction — every row lands or none does.
 * Returns null on any failure. `_silent`: the caller shows one snackbar for the whole session, naming
 * the activity, and the interceptor's generic one would be a second.
 */
export async function createActivityHistorySession(
	request: ActivityHistorySessionRequest,
): Promise<{ sessionId: number; recordIds: number[] } | null> {
	try {
		const { data } = await API.post('/activity-history/session', request, { _silent: true })
		return { sessionId: data.sessionId, recordIds: data.recordIds ?? [] }
	} catch {
		return null
	}
}

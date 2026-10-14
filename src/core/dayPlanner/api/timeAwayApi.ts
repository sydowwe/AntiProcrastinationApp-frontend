import type { AxiosRequestConfig } from 'axios'
import { API } from '@/_common/axiosConfig.ts'
import { useEntityQuery } from '@/_common/api/useEntityQuery.ts'
import { useEntityCommand } from '@/_common/api/useEntityCommand.ts'
import { useFetchFiltered } from '@/_common/api/useFetchFiltered.ts'
import { TimeAway } from '@/core/dayPlanner/dto/response/TimeAway.ts'
import { TimeAwayStamp } from '@/core/dayPlanner/dto/response/TimeAwayStamp.ts'
import type { TimeAwayRequest } from '@/core/dayPlanner/dto/request/TimeAwayRequest.ts'
import type { TimeAwayFilter } from '@/core/dayPlanner/dto/request/TimeAwayFilter.ts'

/**
 * Stretches of time away (F4-02). Create and update are written out rather than taken from
 * `useEntityCommand`: both answer with what the stamp did to each day, not with an id, and the caller
 * needs that answer (the days that kept their own type).
 */
export function useTimeAwayCrud() {
	const url = 'time-away'
	const { fetchById } = useEntityQuery<TimeAway>({ responseClass: TimeAway, entityName: url })
	const { deleteEntity } = useEntityCommand<TimeAway, TimeAwayRequest, TimeAwayRequest>({
		responseClass: TimeAway,
		entityName: url,
	})
	const { fetchFiltered } = useFetchFiltered<TimeAway, TimeAwayFilter>({ responseClass: TimeAway, entityName: url })

	/** 400 on `startDate` for an overlap with another stretch; 404 on `templateId` for a template not the caller's. */
	async function createStretch(request: TimeAwayRequest, requestConfig?: AxiosRequestConfig): Promise<TimeAwayStamp> {
		const { data } = await API.post(url, request, requestConfig)
		return TimeAwayStamp.fromJson(data)
	}

	/** A rename, resize or re-kind; `releasedDates` in the answer are the days the stretch let go. */
	async function updateStretch(
		id: number,
		request: TimeAwayRequest,
		requestConfig?: AxiosRequestConfig,
	): Promise<TimeAwayStamp> {
		const { data } = await API.put(`${url}/${id}`, request, requestConfig)
		return TimeAwayStamp.fromJson(data)
	}

	return { fetchById, fetchFiltered, createStretch, updateStretch, deleteEntity }
}

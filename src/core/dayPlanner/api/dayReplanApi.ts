import type { AxiosRequestConfig } from 'axios'
import { API } from '@/_common/axiosConfig.ts'
import { DayReplanPreview } from '@/core/dayPlanner/dto/response/DayReplanPreview.ts'
import { ApplyDayReplanResult } from '@/core/dayPlanner/dto/response/ApplyDayReplanResult.ts'
import { NextFreeSlot } from '@/core/dayPlanner/dto/response/NextFreeSlot.ts'
import type { ApplyDayReplanRequest } from '@/core/dayPlanner/dto/request/ApplyDayReplanRequest.ts'

/**
 * Re-plan the rest of today, and find free time on a day (FO4). Every `date` is `yyyy-MM-dd`.
 *
 * The packing rule lives on the server, and both the re-plan and `fetchNextFreeSlot` use it, so a block
 * moved by "move later" lands where a re-plan would have put it. See the API's
 * `AdhdTimeOrganizer.Planning/docs/domain-map.md` § *Re-planning the rest of today*.
 */
export function useDayReplanApi() {
	const url = 'calendar/day-plan'

	/** Writes nothing. A date other than the user's today is a 400. */
	async function fetchPreview(date: string): Promise<DayReplanPreview> {
		const { data } = await API.post(`${url}/${date}/replan`)
		return DayReplanPreview.fromJson(data)
	}

	/**
	 * One transaction, one reminder re-sync. A day that changed since the preview, a token older than ten
	 * minutes or a second submit of the same preview is a 409, and nothing is written: ask for a new preview.
	 */
	async function apply(
		date: string,
		request: ApplyDayReplanRequest,
		requestConfig?: AxiosRequestConfig,
	): Promise<ApplyDayReplanResult> {
		const { data } = await API.post(`${url}/${date}/replan/apply`, request, requestConfig)
		return ApplyDayReplanResult.fromJson(data)
	}

	/**
	 * The earliest free stretch of `minutes` on `date`. On today it starts from now; pass `notBeforeMinute`
	 * (minutes past midnight on the user's clock) to look later than that, and `excludeTaskId` for the block
	 * being moved, so its own slot does not count against it.
	 */
	async function fetchNextFreeSlot(
		date: string,
		minutes: number,
		options: { notBeforeMinute?: number; excludeTaskId?: number } = {},
		requestConfig?: AxiosRequestConfig,
	): Promise<NextFreeSlot> {
		const { data } = await API.get(`${url}/${date}/next-free-slot`, {
			...requestConfig,
			params: { minutes, ...options },
		})
		return NextFreeSlot.fromJson(data)
	}

	return { fetchPreview, apply, fetchNextFreeSlot }
}

import { API } from '@/_common/axiosConfig.ts'
import { useEntityQuery } from '@/_common/api/useEntityQuery.ts'
import { useEntityCommand } from '@/_common/api/useEntityCommand.ts'
import { useFetchFiltered } from '@/_common/api/useFetchFiltered.ts'
import { Calendar } from '@/core/dayPlanner/dto/response/Calendar.ts'
import { DayPlan } from '@/core/dayPlanner/dto/response/DayPlan.ts'
import type { CalendarFilter } from '@/core/dayPlanner/dto/request/CalendarFilter.ts'
import { CalendarTaskSummary } from '@/core/dayPlanner/dto/response/CalendarTaskSummary.ts'
import { BatchOperationResponse } from '@/core/dayPlanner/dto/response/BatchOperationResult.ts'
import type { ApplyTemplateToTaskPlannerBatchRequest } from '@/core/dayPlanner/dto/request/ApplyTemplateToTaskPlannerBatchRequest.ts'
import type { DayType } from '@/_common/dto/enum/DayType.ts'

export function useCalendarQuery() {
	const url = 'calendar'
	const { fetchById, fetchByField } = useEntityQuery<Calendar>({ responseClass: Calendar, entityName: url })
	const { updateWithResponse } = useEntityCommand<Calendar, any, any>({
		responseClass: Calendar,
		entityName: url,
	})

	const { fetchFiltered } = useFetchFiltered<Calendar, CalendarFilter>({ responseClass: Calendar, entityName: url })

	//Format 'dd.MM.yyyy'
	function fetchByDate(date: string): Promise<Calendar> {
		return fetchByField('date', date)
	}

	/**
	 * A whole day's plan in one request — calendar, tasks and whether anything was actually planned.
	 *
	 * Prefer this over `fetchByDate` + a `PlannerTaskFilter` round-trip for any read-only view of a
	 * day: that pair is strictly serialized, because the filter is keyed on a calendar id only the
	 * first request can supply. See `prompts/home/backend/B2-plan-by-date.md`.
	 *
	 * Unlike `fetchByDate`, which 404s, a day with nothing planned is a normal 200 with
	 * `calendar: null` and no tasks — so callers branch on `hasPlan`, not on a caught error.
	 *
	 * @param date `yyyy-MM-dd` (`dd-MM-yyyy` is also accepted by the endpoint).
	 */
	async function fetchDayPlan(date: string): Promise<DayPlan> {
		const { data } = await API.get(`${url}/day-plan/${date}`)
		return DayPlan.fromJson(data)
	}

	/**
	 * Per-day task summaries for the cell content of a calendar-grid month — `from`/`until` as
	 * `yyyy-MM-dd` (see `formatDateForApi`), capped at 366 days. Days with no tasks are omitted from
	 * the response, so a missing calendar id means "no tasks", not "not yet loaded".
	 */
	async function fetchTaskSummaries(from: string, until: string): Promise<Map<number, CalendarTaskSummary[]>> {
		const { data } = await API.post(`${url}/task-summaries`, { from, until })
		const map = new Map<number, CalendarTaskSummary[]>()
		for (const day of data.days) {
			map.set(day.calendarId, CalendarTaskSummary.listFromObjects(day.tasks))
		}
		return map
	}

	async function applyTemplateBatch(
		request: ApplyTemplateToTaskPlannerBatchRequest,
	): Promise<BatchOperationResponse> {
		const { data } = await API.post(`${url}/apply-planner-template/batch`, request)
		return BatchOperationResponse.fromJson(data)
	}

	async function changeDayTypeBatch(calendarIds: number[], dayType: DayType): Promise<BatchOperationResponse> {
		const { data } = await API.patch(`${url}/day-type/batch`, { calendarIds, dayType })
		return BatchOperationResponse.fromJson(data)
	}

	return {
		fetchFiltered,
		fetchById,
		fetchByDate,
		fetchDayPlan,
		updateWithResponse,
		fetchTaskSummaries,
		applyTemplateBatch,
		changeDayTypeBatch,
	}
}

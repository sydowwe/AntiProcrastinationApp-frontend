import { API } from '@/_common/axiosConfig.ts'
import { useEntityQuery } from '@/_common/api/useEntityQuery.ts'
import { useEntityCommand } from '@/_common/api/useEntityCommand.ts'
import { useFetchFiltered } from '@/_common/api/useFetchFiltered.ts'
import { Calendar } from '@/core/dayPlanner/dto/response/Calendar.ts'
import { DayPlan } from '@/core/dayPlanner/dto/response/DayPlan.ts'
import type { CalendarFilter } from '@/core/dayPlanner/dto/request/CalendarFilter.ts'

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

	return { fetchFiltered, fetchById, fetchByDate, fetchDayPlan, updateWithResponse }
}

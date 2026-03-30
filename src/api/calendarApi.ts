import { useEntityQuery } from '@/api/base/useEntityQuery.ts'
import { useEntityCommand } from '@/api/base/useEntityCommand.ts'
import { useFetchFiltered } from '@/api/base/useFetchFiltered.ts'
import { Calendar } from '@/dtos/response/activityPlanning/Calendar.ts'
import type { CalendarFilter } from '@/dtos/request/activityPlanning/CalendarFilter.ts'

export function useCalendarQuery() {
	const url = 'calendar'
	const { fetchById, fetchByField } = useEntityQuery<Calendar>({ responseClass: Calendar, entityName: url })
	const { updateWithResponse } = useEntityCommand<Calendar, any, any>({
		responseClass: Calendar,
		entityName: url,
	})

	const { fetchFiltered } = useFetchFiltered<Calendar, CalendarFilter>(Calendar, url)

	//Format 'dd.MM.yyyy'
	function fetchByDate(date: string): Promise<Calendar> {
		return fetchByField('date', date)
	}

	return { fetchFiltered, fetchById, fetchByDate, updateWithResponse }
}

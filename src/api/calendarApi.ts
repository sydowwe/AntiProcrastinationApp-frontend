import { useEntityQuery } from '@/_common/api/useEntityQuery.ts'
import { useEntityCommand } from '@/_common/api/useEntityCommand.ts'
import { useFetchFiltered } from '@/_common/api/useFetchFiltered.ts'
import { Calendar } from '@/dtos/response/activityPlanning/Calendar.ts'
import type { CalendarFilter } from '@/dtos/request/activityPlanning/CalendarFilter.ts'

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

	return { fetchFiltered, fetchById, fetchByDate, updateWithResponse }
}

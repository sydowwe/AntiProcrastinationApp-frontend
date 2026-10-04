import { describe, expect, it } from 'vitest'
import { PlannerTaskRequest } from '@/core/dayPlanner/dto/request/PlannerTaskRequest.ts'
import { CalendarFilter } from '@/core/dayPlanner/dto/request/CalendarFilter.ts'

/**
 * Calendar days go out as `YYYY-MM-DD`, pinned. Sent as a `Date`, local midnight on 4 October serialises
 * to `2026-10-03T22:00:00.000Z` in Bratislava, and the server's `DateOnly` converter resolves that in the
 * server's own zone: the right day on a developer machine, the day before in a UTC container. Asserting
 * the string, not a round trip, keeps this independent of the zone the suite runs in.
 */
describe('calendar days on the wire', () => {
	it('sends a planner task’s `date` as the calendar day it names', () => {
		const request = new PlannerTaskRequest()
		request.date = new Date(2026, 9, 4)
		expect(JSON.parse(JSON.stringify(request)).date).toBe('2026-10-04')
	})

	it('leaves `date` out when the task is named by calendar id', () => {
		const request = new PlannerTaskRequest()
		request.calendarId = 900
		const body = JSON.parse(JSON.stringify(request))
		expect(body).not.toHaveProperty('date')
		expect(body.calendarId).toBe(900)
	})

	it('sends a calendar range as two calendar days', () => {
		const body = JSON.parse(JSON.stringify(new CalendarFilter(new Date(2026, 9, 1), new Date(2026, 9, 31))))
		expect(body).toEqual({ from: '2026-10-01', until: '2026-10-31' })
	})
})

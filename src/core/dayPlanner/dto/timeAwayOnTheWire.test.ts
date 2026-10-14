import { describe, expect, it } from 'vitest'
import { DayType } from '@/_common/dto/enum/DayType.ts'
import { Location } from '@/core/dayPlanner/dto/enum/Location.ts'
import { TimeAwayRequest } from '@/core/dayPlanner/dto/request/TimeAwayRequest.ts'
import { TimeAway } from '@/core/dayPlanner/dto/response/TimeAway.ts'
import { TimeAwayStamp } from '@/core/dayPlanner/dto/response/TimeAwayStamp.ts'
import { Calendar } from '@/core/dayPlanner/dto/response/Calendar.ts'

/** F4-02. Shapes pinned against backend `8e6ceac`'s `TimeAwayTests`; the days are inclusive at both ends. */
describe('time away on the wire', () => {
	const barcelona = {
		id: 7,
		name: 'Barcelona',
		kind: 'Vacation',
		startDate: '2026-08-12',
		endDate: '2026-08-20',
		templateId: null,
		templateName: null,
		location: 'Travel',
		notes: null,
	}

	it('counts both ends of a stretch', () => {
		expect(TimeAway.fromJson(barcelona).lengthInDays).toBe(9)
		expect(TimeAway.fromJson({ ...barcelona, endDate: '2026-08-12' }).lengthInDays).toBe(1)
	})

	it('reads kind and location as enums', () => {
		const stretch = TimeAway.fromJson({ ...barcelona, kind: 'SickDay' })
		expect(stretch.kind).toBe(DayType.SickDay)
		expect(stretch.location).toBe(Location.Travel)
	})

	it('sends the days as calendar days and trims the text', () => {
		const request = new TimeAwayRequest(
			' Barcelona ',
			DayType.Vacation,
			new Date(2026, 7, 31),
			new Date(2026, 8, 3),
		)
		request.notes = '   '
		expect(JSON.parse(JSON.stringify(request))).toEqual({
			name: 'Barcelona',
			kind: 'Vacation',
			startDate: '2026-08-31',
			endDate: '2026-09-03',
			templateId: null,
			location: null,
			notes: null,
		})
	})

	it('round-trips an existing stretch into an edit request', () => {
		const body = JSON.parse(JSON.stringify(TimeAwayRequest.fromTimeAway(TimeAway.fromJson(barcelona))))
		expect(body.startDate).toBe('2026-08-12')
		expect(body.endDate).toBe('2026-08-20')
		expect(body.location).toBe('Travel')
	})

	it('counts the days that kept their own type', () => {
		const stamp = TimeAwayStamp.fromJson({
			id: 7,
			days: [
				{ date: '2026-08-12', calendarId: 1, dayType: 'Vacation', keptOwnDayType: false },
				{ date: '2026-08-13', calendarId: 2, dayType: 'Special', keptOwnDayType: true },
			],
			releasedDates: [],
		})
		expect(stamp.keptOwnDayTypeCount).toBe(1)
		expect(stamp.days[1].dayType).toBe(DayType.Special)
	})

	it("gives a calendar day its stretch's name as the grid's span name", () => {
		const day = {
			id: 1,
			date: '2026-08-12',
			dayType: 'Vacation',
			dayIndex: 3,
			wakeUpTime: { hours: 7, minutes: 0 },
			bedTime: { hours: 23, minutes: 0 },
			totalTasks: 0,
			completedTasks: 0,
		}
		expect(Calendar.fromJson({ ...day, timeAwayId: 7, timeAwayName: 'Barcelona' }).spanName).toBe('Barcelona')
		expect(Calendar.fromJson(day).spanName).toBeNull()
	})
})

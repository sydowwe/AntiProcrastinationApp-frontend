import { computed } from 'vue'
import type { Ref } from 'vue'
import type { ICalendar } from '@/dtos/response/activityPlanning/ICalendar.ts'

export function useCalendarWeeks(
	calendarData: Ref<ICalendar[]>,
	dateRange: Ref<{ start: Date | null; end: Date | null }>,
	visibleDayHeaders: Ref<{ index: number }[]>,
) {
	const calendarWeeks = computed(() => {
		if (!dateRange.value.start || !dateRange.value.end) {
			return []
		}

		const start = new Date(dateRange.value.start)
		const end = new Date(dateRange.value.end)

		const startDay = start.getDay()
		const daysToMonday = startDay === 0 ? 6 : startDay - 1
		const weekStart = new Date(start)
		weekStart.setDate(start.getDate() - daysToMonday)
		weekStart.setHours(0, 0, 0, 0)

		const endDay = end.getDay()
		const daysToSunday = endDay === 0 ? 0 : 7 - endDay
		const weekEnd = new Date(end)
		weekEnd.setDate(end.getDate() + daysToSunday)
		weekEnd.setHours(23, 59, 59, 999)

		const weekMap = new Map<string, Map<number, ICalendar>>()

		calendarData.value.forEach(cal => {
			const parts = cal.date.split('-').map(Number)
			const year = parts[0]
			const month = parts[1]
			const day = parts[2]

			if (!year || !month || !day) {
				console.warn(`Invalid date format: ${cal.date}`)
				return
			}

			const date = new Date(year, month - 1, day)
			const dayOfWeek = date.getDay()
			const daysToMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1
			const monday = new Date(date)
			monday.setDate(date.getDate() - daysToMon)
			monday.setHours(0, 0, 0, 0)

			const weekKey = monday.toISOString().slice(0, 10)

			if (!weekMap.has(weekKey)) {
				weekMap.set(weekKey, new Map())
			}
			weekMap.get(weekKey)!.set(cal.dayIndex, cal)
		})

		const weeks: (ICalendar | null)[][] = []
		const currentDate = new Date(weekStart)

		while (currentDate <= weekEnd) {
			const weekKey = currentDate.toISOString().slice(0, 10)
			const weekData = weekMap.get(weekKey) || new Map()

			const week: (ICalendar | null)[] = new Array(visibleDayHeaders.value.length).fill(null)

			weekData.forEach((cal, dayIndex) => {
				const columnIndex = visibleDayHeaders.value.findIndex(day => day.index === dayIndex)
				if (columnIndex !== -1) {
					week[columnIndex] = cal
				}
			})

			if (week.some(day => day !== null)) {
				weeks.push(week)
			}

			currentDate.setDate(currentDate.getDate() + 7)
		}

		return weeks
	})

	return { calendarWeeks }
}

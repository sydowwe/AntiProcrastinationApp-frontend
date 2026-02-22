import type {DayType} from '@/dtos/enum/DayType.ts'

export interface ICalendar {
	date: string
	dayType: DayType
	dayIndex: number
	label: string | null
	holidayName: string | null
	isToday: boolean
	isWeekend: boolean
}

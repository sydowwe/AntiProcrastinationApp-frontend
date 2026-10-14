import { DayType } from '@/_common/dto/enum/DayType.ts'

/**
 * The day types that mean the user is away: on holiday or ill. Mirrors the server's
 * `DayTypeExtensions.IsAway` (FO1) — on such a day routines stay quiet, a routine period spent mostly
 * away doesn't count against its streak, and the planner suggests by day type rather than weekday.
 * `Special` is deliberately not one of them: it means "unusual", not "absent".
 */
export function isAwayDayType(dayType: DayType | null | undefined): boolean {
	return dayType === DayType.Vacation || dayType === DayType.SickDay
}

/** The two kinds a stretch of time away (F4-02) can be; the server refuses the other three. */
export const awayDayTypes = [DayType.Vacation, DayType.SickDay] as const

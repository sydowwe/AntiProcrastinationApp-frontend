export enum DayOfWeek {
	Monday = 'Monday',
	Tuesday = 'Tuesday',
	Wednesday = 'Wednesday',
	Thursday = 'Thursday',
	Friday = 'Friday',
	Saturday = 'Saturday',
	Sunday = 'Sunday'
}

export const DAY_OF_WEEK_SHORT_LABELS: Record<DayOfWeek, string> = {
	[DayOfWeek.Monday]: 'Mon',
	[DayOfWeek.Tuesday]: 'Tue',
	[DayOfWeek.Wednesday]: 'Wed',
	[DayOfWeek.Thursday]: 'Thu',
	[DayOfWeek.Friday]: 'Fri',
	[DayOfWeek.Saturday]: 'Sat',
	[DayOfWeek.Sunday]: 'Sun',
}

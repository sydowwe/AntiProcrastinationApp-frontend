export enum RecurrenceType {
	DayOfWeek = 'DayOfWeek',
	DayOfMonth = 'DayOfMonth',
	DateRange = 'DateRange',
	DayType = 'DayType',
}

export function getRecurrenceTypeIcon(type: RecurrenceType): string {
	switch (type) {
		case RecurrenceType.DayOfWeek:
			return 'calendar-week'
		case RecurrenceType.DayOfMonth:
			return 'calendar-days'
		case RecurrenceType.DateRange:
			return 'calendar-range'
		case RecurrenceType.DayType:
			return 'tag'
	}
}

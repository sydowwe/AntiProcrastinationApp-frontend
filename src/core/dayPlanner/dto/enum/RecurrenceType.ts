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
			// `calendar-range` is Pro-only; `calendar-days` / `calendar-week` are taken by the two siblings.
			return 'arrows-left-right-to-line'
		case RecurrenceType.DayType:
			return 'tag'
	}
}

// App-local gap filler: the framework's `_common/utils/DateTimeHelper.ts` has no equivalent.
// Pending upstream request (MIGRATION-PLAN.md §7) — delete this file once it lands there.
export const allDaysOfWeek = [
	{ index: 1, name: 'Monday', shortName: 'Mon', isWeekend: false },
	{ index: 2, name: 'Tuesday', shortName: 'Tue', isWeekend: false },
	{ index: 3, name: 'Wednesday', shortName: 'Wed', isWeekend: false },
	{ index: 4, name: 'Thursday', shortName: 'Thu', isWeekend: false },
	{ index: 5, name: 'Friday', shortName: 'Fri', isWeekend: false },
	{ index: 6, name: 'Saturday', shortName: 'Sat', isWeekend: true },
	{ index: 7, name: 'Sunday', shortName: 'Sun', isWeekend: true },
]

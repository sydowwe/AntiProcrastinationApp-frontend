export enum ReminderScheduleType {
	// Fires relative to a single due date/time, with one or more lead-time offsets.
	OneShot = 'OneShot',
	// Fires on a calendar cadence (daily/weekly/monthly/...) anchored to a start date.
	RecurringInterval = 'RecurringInterval',
	// Fires per a cron expression (interpreted in UTC).
	RecurringCron = 'RecurringCron',
}

export const AllReminderScheduleTypeList = [
	ReminderScheduleType.OneShot,
	ReminderScheduleType.RecurringInterval,
	ReminderScheduleType.RecurringCron,
]

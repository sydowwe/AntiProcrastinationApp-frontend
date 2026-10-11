/** The server's `UserTodoListSettings.DefaultDueReminderMinutesBefore` / `MaxDueReminderMinutesBefore`. */
export const DEFAULT_DUE_REMINDER_MINUTES_BEFORE = 30
export const MAX_DUE_REMINDER_MINUTES_BEFORE = 24 * 60

export class UserTodoListSettings {
	constructor(public dueReminderMinutesBefore: number) {}

	/** A user with no settings row gets the defaults, not a 404. */
	static fromJson(json: any): UserTodoListSettings {
		return new UserTodoListSettings(json?.dueReminderMinutesBefore ?? DEFAULT_DUE_REMINDER_MINUTES_BEFORE)
	}
}

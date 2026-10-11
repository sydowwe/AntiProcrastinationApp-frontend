/**
 * Which newly created planner blocks get a reminder without the user asking for one — the server's
 * `UserPlannerSettings.AutoReminderMode` (P1-03). Applies at creation only: changing it never adds or removes a
 * reminder on a block that already exists. Values are camelCase so they double as `planner.autoReminders.mode.*`
 * locale sub-keys; the wire carries the C# member name, so read it through `convertToEnum`.
 */
export enum AutoReminderMode {
	Off = 'off',
	ImportantOnly = 'importantOnly',
	All = 'all',
}

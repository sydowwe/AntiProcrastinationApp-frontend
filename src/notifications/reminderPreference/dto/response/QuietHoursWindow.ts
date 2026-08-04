// A single daily do-not-disturb window. start/end are minutes-from-midnight (0..1439). The window
// may wrap past midnight (start > end means an overnight window, e.g. 22:00 → 06:00). A reminder that
// would fire inside this window is deferred until the window ends — never dropped.
export class QuietHoursWindow {
	constructor(
		public startMinute: number,
		public endMinute: number,
	) {}

	static fromJson(json: any): QuietHoursWindow {
		return new QuietHoursWindow(json.startMinute, json.endMinute)
	}
}

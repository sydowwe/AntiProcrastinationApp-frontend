// Body for PUT /reminder-preference/quiet-hours. Send both start and end (minutes-from-midnight,
// 0..1439) to set/replace the window, or both null to clear quiet hours entirely.
export class SetQuietHoursRequest {
	constructor(
		public startMinute: number | null = null,
		public endMinute: number | null = null,
	) {}

	static fromJson(json: any): SetQuietHoursRequest {
		return new SetQuietHoursRequest(json.startMinute ?? null, json.endMinute ?? null)
	}
}

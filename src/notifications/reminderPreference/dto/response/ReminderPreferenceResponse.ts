import { ReminderKindPreference } from './ReminderKindPreference.ts'
import { QuietHoursWindow } from './QuietHoursWindow.ts'

// The signed-in user's reminder preferences as returned by GET /reminder-preference.
export class ReminderPreferenceResponse {
	constructor(
		public kindPreferences: ReminderKindPreference[],
		public quietHours: QuietHoursWindow | null,
	) {}

	static fromJson(json: any): ReminderPreferenceResponse {
		return new ReminderPreferenceResponse(
			ReminderKindPreference.listFromObjects(json.kindPreferences),
			json.quietHours ? QuietHoursWindow.fromJson(json.quietHours) : null,
		)
	}
}

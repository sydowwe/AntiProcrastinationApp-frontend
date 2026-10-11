import { convertToEnum } from '@/_common/utils/enumHelpers.ts'
import { ApplyTemplateConflictResolution } from '@/core/dayPlanner/dto/enum/ApplyTemplateConflictResolution.ts'
import { AutoReminderMode } from '@/core/dayPlanner/dto/enum/AutoReminderMode.ts'

/** The server's defaults for a user with no settings row (`UserPlannerSettings.DefaultAutoReminder*`): Critical only. */
export const DEFAULT_AUTO_REMINDER_MODE = AutoReminderMode.ImportantOnly
export const DEFAULT_AUTO_REMINDER_MIN_IMPORTANCE = 999

export class UserPlannerSettings {
	constructor(
		public remindersEnabled: boolean,
		public reminderMinutesBefore: number,
		public autoReminderMode: AutoReminderMode,
		public autoReminderMinImportance: number,
		public detailsPanelExpandedByDefault: boolean,
		public arrowKeyNavEnabled: boolean,
		public predefinedSkipReasons: string[],
		public slotDurationMinutes: number,
		public defaultApplyTemplateId: number | null,
		public defaultConflictResolution: ApplyTemplateConflictResolution,
		public defaultApplyPreviewMode: boolean,
	) {}

	static fromJson(json: any): UserPlannerSettings {
		// `GET /planner/settings` answers `"defaultConflictResolution": "MergeIgnore"` — the C# member
		// name, per the global `JsonStringEnumConverter` with no naming policy — while this enum's
		// values are camelCase so they double as `planner.*` locale sub-keys. Passed through raw, the
		// value matched none of `getEnumSelectOptions`' options and the Calendar View settings select
		// rendered the wire name verbatim ("MergeIgnore" instead of "Merge and ignore").
		return new UserPlannerSettings(
			json.remindersEnabled ?? true,
			json.reminderMinutesBefore ?? 10,
			// The same wire-name-vs-camelCase mapping as defaultConflictResolution below.
			convertToEnum(AutoReminderMode, json.autoReminderMode) ?? DEFAULT_AUTO_REMINDER_MODE,
			json.autoReminderMinImportance ?? DEFAULT_AUTO_REMINDER_MIN_IMPORTANCE,
			json.detailsPanelExpandedByDefault ?? true,
			json.arrowKeyNavEnabled ?? true,
			json.predefinedSkipReasons ?? [],
			json.slotDurationMinutes ?? 10,
			json.defaultApplyTemplateId ?? null,
			convertToEnum(ApplyTemplateConflictResolution, json.defaultConflictResolution) ??
				ApplyTemplateConflictResolution.Ignore,
			json.defaultApplyPreviewMode ?? true,
		)
	}
}

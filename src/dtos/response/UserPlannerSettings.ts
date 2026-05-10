import { ApplyTemplateConflictResolution } from '@/dtos/enum/ApplyTemplateConflictResolution.ts'

export class UserPlannerSettings {
	constructor(
		public remindersEnabled: boolean,
		public reminderMinutesBefore: number,
		public detailsPanelExpandedByDefault: boolean,
		public arrowKeyNavEnabled: boolean,
		public predefinedSkipReasons: string[],
		public slotDurationMinutes: number,
		public defaultApplyTemplateId: number | null,
		public defaultConflictResolution: ApplyTemplateConflictResolution,
		public defaultApplyPreviewMode: boolean,
	) {}

	static fromJson(json: any): UserPlannerSettings {
		return new UserPlannerSettings(
			json.remindersEnabled ?? true,
			json.reminderMinutesBefore ?? 10,
			json.detailsPanelExpandedByDefault ?? true,
			json.arrowKeyNavEnabled ?? true,
			json.predefinedSkipReasons ?? [],
			json.slotDurationMinutes ?? 10,
			json.defaultApplyTemplateId ?? null,
			json.defaultConflictResolution ?? ApplyTemplateConflictResolution.Ignore,
			json.defaultApplyPreviewMode ?? true,
		)
	}
}

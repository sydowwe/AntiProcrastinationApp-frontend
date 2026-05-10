import { ApplyTemplateConflictResolution } from '@/dtos/enum/ApplyTemplateConflictResolution.ts'

export class UserPlannerSettingsRequest {
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
}

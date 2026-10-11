import type { ApplyTemplateConflictResolution } from '@/core/dayPlanner/dto/enum/ApplyTemplateConflictResolution.ts'
import type { AutoReminderMode } from '@/core/dayPlanner/dto/enum/AutoReminderMode.ts'

export class UserPlannerSettingsRequest {
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
}

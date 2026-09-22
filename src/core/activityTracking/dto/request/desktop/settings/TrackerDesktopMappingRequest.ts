import type { PatternMatchType } from '@/_common/dto/enum/PatternMatchType.ts'
import type { DesktopDistinctEntriesFilterRequest } from '@/core/activityTracking/dto/request/desktop/settings/DesktopDistinctEntriesFilterRequest.ts'

export class TrackerDesktopMappingRequest {
	constructor(
		public processName: string | null = null,
		public processNameMatchType: PatternMatchType | null = null,
		public productName: string | null = null,
		public productNameMatchType: PatternMatchType | null = null,
		public windowTitle: string | null = null,
		public windowTitleMatchType: PatternMatchType | null = null,
		/** Always sent: the update is a full replace and requires it (F72). An edit copies the row's own value. */
		public isActive: boolean = true,
		public isIgnored: boolean | null = null,
		public activityId: number | null = null,
		public roleId: number | null = null,
		public categoryId: number | null = null,
	) {}

	/** A blank field is no pattern — sent as `""` it would satisfy the server's at-least-one-pattern rule. */
	updatePattern(filter: DesktopDistinctEntriesFilterRequest) {
		this.processName = filter.processName?.trim() || null
		this.processNameMatchType = filter.processNameMatchType
		this.productName = filter.productName?.trim() || null
		this.productNameMatchType = filter.productNameMatchType
		this.windowTitle = filter.windowTitle?.trim() || null
		this.windowTitleMatchType = filter.windowTitleMatchType
	}

	hasPattern(): boolean {
		return this.processName != null || this.productName != null || this.windowTitle != null
	}
}

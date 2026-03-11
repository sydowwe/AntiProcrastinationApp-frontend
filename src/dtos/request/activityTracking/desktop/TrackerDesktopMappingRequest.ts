import {BaseTrackerDesktopMappingRequest} from '@/dtos/request/activityTracking/desktop/BaseTrackerDesktopMappingRequest.ts';

export class TrackerDesktopMappingRequest {
	constructor(
		public pattern: BaseTrackerDesktopMappingRequest,
		public activityId: number | null = null,
		public roleId: number | null = null,
		public categoryId: number | null = null,
	) {
	}
}
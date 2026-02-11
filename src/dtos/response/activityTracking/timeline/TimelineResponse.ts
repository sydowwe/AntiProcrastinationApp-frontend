import {TimelineSession} from '@/dtos/response/activityTracking/timeline/TimelineSession.ts'

export class TimelineResponse {
	constructor(
		public activeSessions: TimelineSession[],
		public backgroundSessions: TimelineSession[]
	) {
	}

	static fromJson(json: any): TimelineResponse {
		return new TimelineResponse(
			json.activeSessions?.map((s: any) => TimelineSession.fromJson(s)) || [],
			json.backgroundSessions?.map((s: any) => TimelineSession.fromJson(s)) || []
		)
	}
}

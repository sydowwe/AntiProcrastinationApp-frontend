import {TimelineSessionDto} from '@/dtos/response/activityTracking/timeline/TimelineSessionDto.ts'

export class TimelineResponse {
	constructor(
		public primarySessions: TimelineSessionDto[],
		public detailSessions: TimelineSessionDto[],
		public backgroundSessions: TimelineSessionDto[]
	) {
	}

	static fromJson(json: any): TimelineResponse {
		return new TimelineResponse(
			json.primarySessions?.map((s: any) => TimelineSessionDto.fromJson(s)) || [],
			json.detailSessions?.map((s: any) => TimelineSessionDto.fromJson(s)) || [],
			json.backgroundSessions?.map((s: any) => TimelineSessionDto.fromJson(s)) || []
		)
	}
}

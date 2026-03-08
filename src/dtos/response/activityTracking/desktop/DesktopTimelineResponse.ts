import {DesktopTimelineSession} from './DesktopTimelineSession.ts'

export class DesktopTimelineResponse {
	constructor(
		public primarySessions: DesktopTimelineSession[],
		public detailSessions: DesktopTimelineSession[],
		public backgroundSessions: DesktopTimelineSession[]
	) {
	}

	static fromJson(json: any): DesktopTimelineResponse {
		return new DesktopTimelineResponse(
			json.primarySessions?.map((s: any) => DesktopTimelineSession.fromJson(s)) || [],
			json.detailSessions?.map((s: any) => DesktopTimelineSession.fromJson(s)) || [],
			json.backgroundSessions?.map((s: any) => DesktopTimelineSession.fromJson(s)) || []
		)
	}
}

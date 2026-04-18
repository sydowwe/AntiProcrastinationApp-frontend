import { AndroidTimelineSession } from './AndroidTimelineSession.ts'

export class AndroidTimelineResponse {
	constructor(public sessions: AndroidTimelineSession[]) {}

	static fromJson(json: any): AndroidTimelineResponse {
		return new AndroidTimelineResponse(json.sessions?.map((s: any) => AndroidTimelineSession.fromJson(s)) ?? [])
	}
}

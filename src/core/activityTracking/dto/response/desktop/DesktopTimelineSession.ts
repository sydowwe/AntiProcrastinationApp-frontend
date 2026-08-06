export class DesktopTimelineSession {
	constructor(
		public id: number,
		public processName: string,
		public productName: string,
		public startedAt: Date,
		public endedAt: Date,
		public durationSeconds: number,
		public totalSeconds: number,
	) {}

	static fromJson(json: any): DesktopTimelineSession {
		return new DesktopTimelineSession(
			json.id,
			json.processName,
			json.productName,
			new Date(json.startedAt),
			new Date(json.endedAt),
			json.durationSeconds,
			json.totalSeconds,
		)
	}
}

export class AndroidTimelineSession {
	constructor(
		public id: number,
		public packageName: string,
		public appLabel: string,
		public startedAt: Date,
		public endedAt: Date,
		public durationSeconds: number,
		public totalSeconds: number,
	) {}

	static fromJson(json: any): AndroidTimelineSession {
		return new AndroidTimelineSession(
			json.id,
			json.packageName,
			json.appLabel,
			new Date(json.startedAt),
			new Date(json.endedAt),
			json.durationSeconds,
			json.totalSeconds,
		)
	}
}

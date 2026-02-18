export class TimelineSessionDto {
	constructor(
		public id: number,
		public domain: string,
		public startedAt: Date,
		public endedAt: Date,
		public durationSeconds: number,
		public totalSeconds: number,
		public url?: string
	) {
	}

	static fromJson(json: any): TimelineSessionDto {
		return new TimelineSessionDto(json.id, json.domain, new Date(json.startedAt), new Date(json.endedAt), json.durationSeconds, json.totalSeconds, json.url)
	}
}

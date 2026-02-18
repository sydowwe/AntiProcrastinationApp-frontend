export class TimelineSegment {
	constructor(
		public type: 'activity' | 'gap',
		public from: Date,
		public to: Date,
		public durationMinutes: number,
	) {}
}

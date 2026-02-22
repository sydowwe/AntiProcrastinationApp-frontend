export class CalendarActivityRequest {
	constructor(
		public startDate: string,
		public endDate: string,
		public topN: number = 3,
	) {
	}
}

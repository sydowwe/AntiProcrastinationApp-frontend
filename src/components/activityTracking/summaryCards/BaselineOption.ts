export enum BaselineType {
	Last7Days = 'last7days',
	Last30Days = 'last30days',
	SameWeekday = 'sameWeekday',
	AllTime = 'allTime'
}

export class BaselineOption {
	constructor(
		public value: BaselineType,
		public title: string
	) {
	}
}

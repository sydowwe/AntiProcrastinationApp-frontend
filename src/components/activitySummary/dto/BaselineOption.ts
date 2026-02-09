export type BaselineType = 'last7days' | 'last30days' | 'sameWeekday' | 'allTime';

export class BaselineOption {
	constructor(
		public value: BaselineType,
		public label: string
	) {}
}

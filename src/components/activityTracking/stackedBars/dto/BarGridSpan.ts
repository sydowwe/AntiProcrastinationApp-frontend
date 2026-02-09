import type { ColumnData } from './ColumnData'

export class BarGridSpan {
	constructor(
		public windowIndex: number,
		public activityIndex: number,
		public domain: string,
		public gridColumnStart: number,
		public gridColumnEnd: number,
		public gridRowStart: number,
		public gridRowEnd: number,
		public data: ColumnData
	) {}
}

import type { ColumnData } from './ColumnData'

export class ProcessedWindow {
	constructor(
		public windowStart: Date,
		public windowEnd: Date,
		public columns: ColumnData[],
		public spanCount: number = 1,
		public gridColumnStart?: number,
		public gridColumnEnd?: number
	) {}
}

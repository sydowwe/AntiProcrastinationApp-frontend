import type { ColumnData } from './ColumnData'

export class ProcessedWindow {
	constructor(
		public windowStart: Date,
		public windowEnd: Date,
		public columns: ColumnData[],
		public gridColumnStart?: number,
		public gridColumnEnd?: number
	) {}
}

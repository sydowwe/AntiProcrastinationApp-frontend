export class ColumnData {
	constructor(
		public domain: string,
		public activeSeconds: number,
		public backgroundSeconds: number,
		public activeMinutes: number,
		public backgroundMinutes: number,
		public url?: string
	) {
	}
}
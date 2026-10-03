export class ColumnData {
	constructor(
		/** The item's identity, or `OTHER_DOMAIN` for the folded column. */
		public key: string,
		public label: string,
		public activeSeconds: number,
		public backgroundSeconds: number,
		public activeMinutes: number,
		public backgroundMinutes: number,
		public url?: string,
		public color?: string,
	) {}
}

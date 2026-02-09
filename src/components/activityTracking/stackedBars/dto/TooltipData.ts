export class TooltipData {
	constructor(
		public windowLabel: string,
		public domain: string,
		public activeMinutes: number,
		public backgroundMinutes: number,
		public totalMinutes: number,
		public url?: string
	) {
	}
}
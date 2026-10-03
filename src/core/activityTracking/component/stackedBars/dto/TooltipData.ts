export class TooltipData {
	constructor(
		public key: string,
		public label: string,
		public activeMinutes: number,
		public backgroundMinutes: number,
		public totalMinutes: number,
		public url?: string,
	) {}
}

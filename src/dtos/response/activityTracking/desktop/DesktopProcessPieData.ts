export class DesktopProcessPieData {
	constructor(
		public processName: string,
		public productName: string,
		public activeSeconds: number,
		public backgroundSeconds: number,
		public totalSeconds: number,
		public windowTitles: string[],
		public entries: number
	) {
	}

	static fromJson(json: any): DesktopProcessPieData {
		return new DesktopProcessPieData(
			json.processName,
			json.productName,
			json.activeSeconds,
			json.backgroundSeconds,
			json.totalSeconds,
			json.windowTitles ?? [],
			json.entries
		)
	}
}

export class DesktopWindowActivity {
	constructor(
		public processName: string,
		public productName: string,
		public activeSeconds: number,
		public backgroundSeconds: number,
		public totalSeconds: number
	) {
	}

	static fromJson(json: any): DesktopWindowActivity {
		return new DesktopWindowActivity(
			json.processName,
			json.productName,
			json.activeSeconds,
			json.backgroundSeconds,
			json.totalSeconds
		)
	}
}

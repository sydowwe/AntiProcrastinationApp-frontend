export class DesktopWindowTitleStats {
	constructor(
		public windowTitle: string,
		public totalSeconds: number,
		public activeSeconds: number,
		public backgroundSeconds: number,
		public fullscreenSeconds: number,
		public soundSeconds: number
	) {
	}

	static fromJson(json: any): DesktopWindowTitleStats {
		return new DesktopWindowTitleStats(
			json.windowTitle,
			json.totalSeconds,
			json.activeSeconds,
			json.backgroundSeconds,
			json.fullscreenSeconds,
			json.soundSeconds
		)
	}
}

export class DesktopMonitorBreakdown {
	constructor(
		public monitor: number,
		public activeSeconds: number
	) {
	}

	static fromJson(json: any): DesktopMonitorBreakdown {
		return new DesktopMonitorBreakdown(json.monitor, json.activeSeconds)
	}
}

export class DesktopProcessDetailsResponse {
	constructor(
		public processName: string,
		public productName: string,
		public totalSeconds: number,
		public activeSeconds: number,
		public backgroundSeconds: number,
		public fullscreenSeconds: number,
		public soundSeconds: number,
		public monitorBreakdown: DesktopMonitorBreakdown[],
		public entries: number,
		public windowTitles: DesktopWindowTitleStats[]
	) {
	}

	static fromJson(json: any): DesktopProcessDetailsResponse {
		return new DesktopProcessDetailsResponse(
			json.processName,
			json.productName,
			json.totalSeconds,
			json.activeSeconds,
			json.backgroundSeconds,
			json.fullscreenSeconds,
			json.soundSeconds,
			json.monitorBreakdown?.map((m: any) => DesktopMonitorBreakdown.fromJson(m)) || [],
			json.entries,
			json.windowTitles?.map((w: any) => DesktopWindowTitleStats.fromJson(w)) || []
		)
	}
}

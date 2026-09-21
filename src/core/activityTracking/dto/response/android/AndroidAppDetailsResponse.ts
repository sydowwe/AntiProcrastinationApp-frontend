export class AndroidAppDeviceStats {
	constructor(
		public deviceId: string,
		public totalSeconds: number,
		public sessions: number,
	) {}

	static fromJson(json: any): AndroidAppDeviceStats {
		const { deviceId = '', totalSeconds = 0, sessions = 0 } = json
		return new AndroidAppDeviceStats(deviceId, totalSeconds, sessions)
	}
}

export class AndroidAppDayStats {
	constructor(
		/** Plain `YYYY-MM-DD`, already on the user's clock — not an instant, so it is not parsed. */
		public date: string,
		public totalSeconds: number,
		public sessions: number,
	) {}

	static fromJson(json: any): AndroidAppDayStats {
		const { date = '', totalSeconds = 0, sessions = 0 } = json
		return new AndroidAppDayStats(date, totalSeconds, sessions)
	}
}

/**
 * `GET /activity-tracking/android/app-details` — the Android sibling of `DesktopProcessDetailsResponse`,
 * minus the Active/Background split the source does not have (`B23`, `F48`). `lastUseUtc` is the last
 * instant the app was in use (latest session end), not the last session's start.
 */
export class AndroidAppDetailsResponse {
	constructor(
		public packageName: string,
		public appLabel: string,
		public totalSeconds: number,
		public sessions: number,
		public firstUseUtc: Date,
		public lastUseUtc: Date,
		public meanSessionSeconds: number,
		public longestSessionSeconds: number,
		public devices: AndroidAppDeviceStats[],
		public days: AndroidAppDayStats[],
	) {}

	static fromJson(json: any): AndroidAppDetailsResponse {
		const {
			packageName = '',
			appLabel = packageName,
			totalSeconds = 0,
			sessions = 0,
			firstUseUtc,
			lastUseUtc,
			meanSessionSeconds = 0,
			longestSessionSeconds = 0,
			devices = [],
			days = [],
		} = json
		return new AndroidAppDetailsResponse(
			packageName,
			appLabel,
			totalSeconds,
			sessions,
			new Date(firstUseUtc),
			new Date(lastUseUtc),
			meanSessionSeconds,
			longestSessionSeconds,
			devices.map((d: any) => AndroidAppDeviceStats.fromJson(d)),
			days.map((d: any) => AndroidAppDayStats.fromJson(d)),
		)
	}
}

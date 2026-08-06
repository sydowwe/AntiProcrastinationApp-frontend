export class AndroidAppPieData {
	constructor(
		public packageName: string,
		public appLabel: string,
		public seconds: number,
		public totalSeconds: number,
	) {}

	static fromJson(json: any): AndroidAppPieData {
		return new AndroidAppPieData(json.packageName, json.appLabel, json.seconds, json.totalSeconds)
	}
}

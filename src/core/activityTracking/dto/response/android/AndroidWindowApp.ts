export class AndroidWindowApp {
	constructor(
		public packageName: string,
		public appLabel: string,
		public seconds: number,
	) {}

	static fromJson(json: any): AndroidWindowApp {
		return new AndroidWindowApp(json.packageName, json.appLabel, json.seconds)
	}
}

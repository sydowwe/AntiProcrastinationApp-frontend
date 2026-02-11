export class WindowActivity {
	constructor(
		public domain: string,
		public activeSeconds: number,
		public backgroundSeconds: number,
		public totalSeconds: number,
		public url?: string
	) {
	}

	static fromJson(json: any): WindowActivity {
		return new WindowActivity(
			json.domain,
			json.activeSeconds,
			json.backgroundSeconds,
			json.totalSeconds,
			json.url
		)
	}
}
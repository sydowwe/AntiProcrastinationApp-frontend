export class DomainPieData {
	constructor(
		public domain: string,
		public activeSeconds: number,
		public backgroundSeconds: number,
		public totalSeconds: number,
		public pages: string[],
		public entries: number
	) {
	}

	static fromJson(json: any): DomainPieData {
		return new DomainPieData(
			json.domain,
			json.activeSeconds,
			json.backgroundSeconds,
			json.totalSeconds,
			json.pages,
			json.entries
		);
	}
}

export class SpFileUploadResponse {
	constructor(
		public id: string,
		public name: string,
		public webUrl: string,
		public size?: number
	) {
	}

	static fromJson(json: any) {
		return new SpFileUploadResponse(
			json.id,
			json.name,
			json.webUrl,
			json.size
		);
	}
}

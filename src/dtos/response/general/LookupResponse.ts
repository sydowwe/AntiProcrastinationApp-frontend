export class LookupResponse {
	constructor(
		public id: number,
		public text: string,
		public sortOrder: number,
	) {}

	static fromJson(json: any) {
		const { id = 0, text = '', sortOrder = 0 } = json
		return new LookupResponse(id, text, sortOrder)
	}

	static listFromObjects(objects: any[]) {
		return objects.map((item: object) => LookupResponse.fromJson(item))
	}
}

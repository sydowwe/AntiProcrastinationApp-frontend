export class LookupRequest {
	constructor(
		public text: string = '',
		public sortOrder: string = '',
	) {}

	static fromJson(object: any) {
		const { text = '', sortOrder = '' } = object
		return new LookupRequest(text, sortOrder)
	}
}

export class QuickEditActivityRequest {
	constructor(public name: string = '',
	            public text: string | null = null,
	            public categoryId: number | null = null,
	) {
	}

	static fromJson(object: any) {
		const {
			name = '',
			text = '',
		} = object;
		return new QuickEditActivityRequest(name, text);
	}
}
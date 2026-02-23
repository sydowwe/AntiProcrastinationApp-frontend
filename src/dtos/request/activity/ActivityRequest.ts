export class ActivityRequest {

	constructor(public name: string = '',
	            public text: string | null = null,
	            public roleId: number | null = null,
	            public categoryId: number | null = null,
	            public isUnavoidable: boolean = false,
	) {
	}

	static fromJson(object: any) {
		const {
			name = '',
			text = '',
			isUnavoidable = false,
			roleId = 0,
			categoryId = 0
		} = object;
		return new ActivityRequest(name, text, isUnavoidable, roleId, categoryId);
	}
}



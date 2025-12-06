export class ActivityRequest {

	constructor(public name: string = '',
	            public text: string | null = null,
	            public roleId: number | null = null,
	            public categoryId: number | null = null,
	            public isUnavoidable: boolean = false,
	            public isOnToDoList: boolean = false,
	            public toDoListUrgencyId: number | null = null
	) {
	}

	static fromJson(object: any) {
		const {
			name = '',
			text = '',
			isOnToDoList = false,
			isUnavoidable = false,
			roleId = 0,
			categoryId = 0
		} = object;
		return new ActivityRequest(name, text, isOnToDoList, isUnavoidable, roleId, categoryId);
	}
}



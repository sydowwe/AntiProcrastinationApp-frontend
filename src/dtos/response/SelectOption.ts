export class SelectOption {
	constructor(
		public id: number,
		public text: string,
	) {
	}

	static fromJson(json: any) {
		return new SelectOption(json.id, json.text);
	}

	static listFromJsonList(jsonList: any[]) {
		return jsonList.map((item: object) => this.fromJson(item));
	}

	static fromIdName(object: any) {
		const {
			id = 0,
			name = '',
		} = object;
		return new SelectOption(id, name);
	}
}

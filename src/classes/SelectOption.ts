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

export class LookupRequest {
	constructor(
		public text: string,
		public sortOrder?: string,
	) {
	}
}

export class LookupResponse extends SelectOption {
	constructor(
		id: number,
		public text: string,
		public sortOrder: string,
	) {
		super(id, text);
	}

	static fromJson(json: any): LookupResponse {
		return new LookupResponse(json.id, json.text, json.sortOrder);
	}

	static listFromJsonList(jsonList: any[]): LookupResponse[] {
		return jsonList.map((item: object) => this.fromJson(item));
	}
}

export class LookupFilterRequest {
	constructor(
		public text: string | null = null,
	) {
	}
}
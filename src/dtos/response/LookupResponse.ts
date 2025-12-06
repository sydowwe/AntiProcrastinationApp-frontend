import {SelectOption} from './SelectOption';

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

export class ActivityFilterFormResponse {
	constructor(
		public id: number,
		public text: string,
		public roleId: number,
		public categoryId: number | null,
	) {
	}

	static fromJson(json: any): ActivityFilterFormResponse {
		return new ActivityFilterFormResponse(
			json.id,
			json.text,
			json.roleId,
			json.categoryId,
		);
	}
}
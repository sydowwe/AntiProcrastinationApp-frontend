export class BatchOperationResult {
	constructor(
		public calendarId: number,
		public succeeded: boolean,
	) {}

	static fromJson(json: any): BatchOperationResult {
		return new BatchOperationResult(json.calendarId, json.succeeded)
	}

	static listFromObjects(objects: any[]): BatchOperationResult[] {
		return objects.map((item: object) => this.fromJson(item))
	}
}

export class BatchOperationResponse {
	constructor(
		public results: BatchOperationResult[],
		public succeededCount: number,
	) {}

	get failedCount(): number {
		return this.results.length - this.succeededCount
	}

	static fromJson(json: any): BatchOperationResponse {
		const results = BatchOperationResult.listFromObjects(json.results ?? [])
		return new BatchOperationResponse(results, json.succeededCount ?? results.filter(r => r.succeeded).length)
	}
}

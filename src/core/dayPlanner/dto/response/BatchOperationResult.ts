import { convertToEnum } from '@/_common/utils/enumHelpers.ts'
import { CalendarBatchFailureReason } from '@/core/dayPlanner/dto/enum/CalendarBatchFailureReason.ts'

export class BatchOperationResult {
	constructor(
		public calendarId: number,
		public succeeded: boolean,
		/** `null` when the day succeeded. */
		public failureReason: CalendarBatchFailureReason | null,
	) {}

	static fromJson(json: any): BatchOperationResult {
		const { calendarId, succeeded = false, failureReason = null } = json
		return new BatchOperationResult(
			calendarId,
			succeeded,
			succeeded
				? null
				: (convertToEnum(CalendarBatchFailureReason, failureReason) ?? CalendarBatchFailureReason.Error),
		)
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

	get failedResults(): BatchOperationResult[] {
		return this.results.filter(r => !r.succeeded)
	}

	static fromJson(json: any): BatchOperationResponse {
		const results = BatchOperationResult.listFromObjects(json.results ?? [])
		return new BatchOperationResponse(results, json.succeededCount ?? results.filter(r => r.succeeded).length)
	}
}
